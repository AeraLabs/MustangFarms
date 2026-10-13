// Run with Playwright installed in your development environment: node tests/smoke.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
  const target=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(target,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.end(bytes);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--single-process']}: {})});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading="eager";return img.decode();}));});
    assert.equal(await page.locator('.product-card').count(),8);
    // Public storefront should look complete while clearly identifying non-live orders.
    assert.equal(await page.locator('.hero-grain,.preview-note,.harvest-ribbon').count(),0);
    assert.equal(await page.locator('.farm-provenance,.hero-footer').count(),0);
    assert.match(await page.locator('.harvest-note').innerText(),/pickup orders aren't open yet/i);
    assert.match(await page.locator('.faq-list').textContent(),/not sent to the farm/i);
    assert.match(await page.locator('.story-copy').innerText(),/22 years in the military/i);
    // The growing-practices message belongs in the harvest, not on every banner.
    assert.equal(await page.locator('.garden-promise').count(),1);
    assert.equal(await page.locator('.garden-promise-hero,.story-garden-note').count(),0);
    assert.match(await page.locator('.garden-promise-harvest').innerText(),/organic practices, without pesticides/i);
    const storefrontCopy=await page.locator('#storefront').innerText();
    assert.equal((storefrontCopy.match(/pesticides/gi)||[]).length,1,'No repeated pesticide claim across storefront sections');
    assert.equal(await page.locator('.idaho-origin-card img').getAttribute('src'),'./assets/idaho-outline.svg');
    assert.equal(await page.locator('.idaho-origin-card img').getAttribute('alt'),'');
    assert.match(await page.locator('.idaho-map-art').getAttribute('aria-label'),/Meridian/);
    assert.equal(await page.locator('.idaho-map-pin').count(),1);
    // The truck must roll across the farm scene without a bounce, at desktop and mobile scales.
    assert.equal(await page.locator('.farm-truck-svg .truck-wheel').count(),2);
    assert.equal(await page.locator('.farm-drive .road-chicken').count(),0,'No chicken should overlap the driving truck');
    assert((await page.locator('.little-chicken').count())>0,'The rest of the farm still has chickens');
    assert.equal(await page.locator('.idaho-map-pin').evaluate(el=>getComputedStyle(el,'::before').animationName),'none','Reduced motion should stop the map pulse');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>!document.body.classList.contains('motion-paused'));
    assert.equal(await page.locator('.idaho-map-pin').evaluate(el=>getComputedStyle(el,'::before').animationName),'meridian-pulse','The Meridian marker should gently pulse');
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:900});
      const truck=await page.locator('.truck-runway').evaluate(el=>{
        const body=el.querySelector('.vintage-truck');
        return {width:el.getBoundingClientRect().width,animation:getComputedStyle(el).animationName,
          bodyAnimation:getComputedStyle(body).animationName,bodyScale:getComputedStyle(body).transform};
      });
      assert.equal(truck.animation,'truck-drive','Truck should travel horizontally');
      assert.equal(truck.bodyAnimation,'none','Truck body must not bounce');
      assert(Math.abs(truck.width-(width<=720?259.2:360))<1,'Truck must have responsive width');
      assert.notEqual(truck.bodyScale,'none','Truck art should retain its defined scale');
      const start=await page.locator('.truck-runway').evaluate(el=>el.getBoundingClientRect().left);
      await page.waitForTimeout(120);
      const next=await page.locator('.truck-runway').evaluate(el=>el.getBoundingClientRect().left);
      assert(next>start,'Truck must steadily drive from left to right');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.body.classList.contains('motion-paused'));
    assert.equal(await page.locator('.truck-runway').evaluate(el=>getComputedStyle(el).animationName),'none','Reduced-motion truck must remain still');
    for(const width of [320,360,390,430,768,1440]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const overflow=await page.evaluate(()=>[...document.querySelectorAll("body *")].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(el).position!=="fixed").map(el=>({tag:el.tagName,cls:el.className,right:el.getBoundingClientRect().right})));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}px: ${JSON.stringify(overflow)}`);
      assert(await page.locator('.garden-promise-harvest').isVisible(),`Harvest practices note should be visible at ${width}px`);
      const welcome=await page.evaluate(()=>{
        const intro=document.querySelector('.welcome-intro').getBoundingClientRect();
        const card=document.querySelector('.idaho-origin-card').getBoundingClientRect();
        const heading=document.querySelector('.welcome>h2').getBoundingClientRect();
        return {introLeft:intro.left,introRight:intro.right,introBottom:intro.bottom,cardTop:card.top,cardRight:card.right,headingWidth:heading.width};
      });
      assert(welcome.introRight-welcome.introLeft>=Math.min(width*.58,290),`Welcome text must not collapse at ${width}px`);
      assert(welcome.cardRight<=width+1,`Idaho card must fit viewport at ${width}px`);
      if(width<=600){
        assert(welcome.cardTop>=welcome.introBottom,`Idaho card should follow text on mobile at ${width}px`);
        const idaho=await page.locator('.idaho-origin-card').evaluate(el=>{
          const card=el.getBoundingClientRect(),map=el.querySelector('.idaho-map-art').getBoundingClientRect(),copy=el.querySelector('.idaho-card-copy').getBoundingClientRect();
          const style=getComputedStyle(el);
          const inset=['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((sum,prop)=>sum+parseFloat(style[prop]),0);
          return {height:card.height,emptyHeight:card.height-inset-Math.max(copy.height,map.height),
            cardTop:card.top,cardBottom:card.bottom,mapTop:map.top,mapBottom:map.bottom,
            mapLeft:map.left,mapRight:map.right,copyRight:copy.right,
            cardLeft:card.left,cardRight:card.right,copyFits:el.querySelector('.idaho-card-copy').scrollWidth<=el.querySelector('.idaho-card-copy').clientWidth+1};
        });
        assert(idaho.height<300,`Idaho card should be compact at ${width}px: ${JSON.stringify(idaho)}`);
        assert(Math.abs(idaho.emptyHeight)<12,`Idaho card must follow content, not leave an empty grid row, at ${width}px: ${JSON.stringify(idaho)}`);
        assert(idaho.mapLeft>=idaho.copyRight+4,`Idaho art must sit beside the copy with spacing at ${width}px`);
        assert(idaho.copyFits,`Idaho description and location must fit the copy column at ${width}px`);
        assert(idaho.mapBottom<=idaho.cardBottom+1 && idaho.mapTop>=idaho.cardTop-1 &&
          idaho.mapLeft>=idaho.cardLeft && idaho.mapRight<=idaho.cardRight,`Map must fit inside the card at ${width}px`);
        const seal=await page.locator('.harvest-seal').evaluate(el=>{
          const a=el.getBoundingClientRect(),b=el.closest('.hero-scene').getBoundingClientRect();
          const spans=[...el.children];
          return {center:(a.left+a.right)/2,artCenter:(b.left+b.right)/2,
            left:a.left,right:a.right,top:a.top,bottom:a.bottom,
            textFits:spans.every(span=>span.scrollWidth<=span.clientWidth+1),
            lines:spans.map(span=>({text:span.textContent,width:span.clientWidth,scroll:span.scrollWidth})),
            mainFont:parseFloat(getComputedStyle(el.querySelector('.harvest-seal-main')).fontSize),
            subtitleFont:parseFloat(getComputedStyle(el.querySelector('.harvest-seal-bottom')).fontSize)};
        });
        assert(Math.abs(seal.center-seal.artCenter)<4,`In season seal should be centered at ${width}px`);
        assert(seal.left>=0 && seal.right<=width,`Season seal must stay within the viewport at ${width}px`);
        assert(seal.textFits,`Every season seal line must fit inside its circle at ${width}px: ${JSON.stringify(seal.lines)}`);
        assert(seal.mainFont>seal.subtitleFont+6,`Season heading must stay more prominent than its subtitle at ${width}px`);
      }
    }
    if(process.env.QA_SCREENSHOTS){
      await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading="eager";return img.decode().catch(()=>{});}));});
      await page.screenshot({path:path.join(process.env.QA_SCREENSHOTS,'desktop.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(process.env.QA_SCREENSHOTS,'mobile.png'),fullPage:true});
    }
    await page.locator('#produce-search').fill('basil');assert.equal(await page.locator('.product-card').count(),1);
    await page.locator('#produce-search').fill('nonexistent');assert.equal(await page.locator('.product-card').count(),0);
    await page.locator('[data-clear-filters]').click();assert.equal(await page.locator('.product-card').count(),8);
    await page.locator('[data-filter="Fruit"]').click();assert.equal(await page.locator('.product-card').count(),2);
    await page.locator('[data-filter="All"]').click();
    await page.locator('[data-add="1"]').click();await page.locator('[data-add="2"]').click();
    assert.equal(await page.locator('#cart-count').innerText(),'2');
    assert.equal(await page.locator('#basket-summary-total').innerText(),'$7.00');
    await page.locator('#basket-summary').click();
    assert(await page.locator('#storefront').evaluate(el=>el.inert));
    await page.keyboard.press('Shift+Tab');assert(await page.locator('.checkout-submit').evaluate(el=>el===document.activeElement));
    await page.locator('#checkout-form [name="name"]').fill('Test Gardener');await page.locator('[name="phone"]').fill('555-0100');
    await page.locator('[data-cart-adjust="1"][data-delta="1"]').click();
    assert.equal(await page.locator('#checkout-form [name="name"]').inputValue(),'Test Gardener');
    assert.equal(await page.locator('.cart-total strong').innerText(),'$11.00');
    await page.locator('.checkout-submit').click();
    assert.equal(await page.locator('#order-success-title').innerText(),'Your test order is in!');
    assert(await page.locator('#order-success-title').evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Escape');assert(!(await page.locator('#storefront').evaluate(el=>el.inert)));
    await page.locator('#admin-entry').click();await page.locator('#enter-admin').click();
    assert.equal(await page.locator('#stat-new').innerText(),'2');
    await page.locator('#tab-orders').click();assert.equal(await page.locator('.order-admin-card').count(),2);
    for(const status of ['preparing','ready','completed'])await page.locator(`[data-order="MF-1001"][data-status="${status}"]`).click();
    await page.locator('#order-filter').selectOption('completed');assert.equal(await page.locator('.order-admin-card').count(),1);
    await page.locator('#tab-inventory').click();
    await page.locator('[data-edit="1"]').click();assert.equal(await page.locator('#field-stock').inputValue(),'12');
    await page.locator('#field-stock').fill('0');await page.locator('#product-form [type="submit"]').click();
    await page.locator('#add-product').click();await page.locator('#field-name').fill('Test radishes');
    await page.locator('#field-price').fill('2');await page.locator('#field-unit').fill('bunch');await page.locator('#field-stock').fill('3');
    await page.locator('#product-form [type="submit"]').click();assert.equal(await page.locator('.inventory-item').count(),9);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Admin mobile overflow');
    await page.locator('#back-to-shop').click();assert(await page.locator('[data-add="1"]').isDisabled());
    await page.locator('#available-only').check();assert.equal(await page.locator('.product-card').count(),8);
    await page.reload();assert.equal(await page.locator('.product-card').count(),8);assert.equal(await page.locator('#cart-count').innerText(),'0');
    assert.equal(await page.locator('#motion-toggle').innerText(),'Reduced motion enabled');
    assert.deepEqual(errors,[]);console.log('PASS: responsive widths, search, categories, basket totals, focus trap, checkout draft, order lifecycle, inventory editing, adding produce, stock filtering, refresh reset, reduced motion, no runtime errors.');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
