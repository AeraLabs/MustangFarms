"use strict";
// Mustang Farms DEMO: in-memory only. No authentication, storage, network, or payments.
let products=[
{id:1,name:"Garden Tomatoes",category:"Vegetables",emoji:"🍅",price:4,unit:"basket",stock:14,color:"pink",description:"Sun-ripened and packed with summertime flavor.",visible:true},
{id:2,name:"Sweet Carrots",category:"Vegetables",emoji:"🥕",price:3,unit:"bunch",stock:20,color:"orange",description:"Crisp, sweet and straight from the soil.",visible:true},
{id:3,name:"Fresh Lettuce",category:"Vegetables",emoji:"🥬",price:3.5,unit:"head",stock:11,color:"green",description:"Tender, leafy greens for the freshest salads.",visible:true},
{id:4,name:"Sweet Corn",category:"Vegetables",emoji:"🌽",price:5,unit:"half dozen",stock:18,color:"yellow",description:"A little sunshine in every golden ear.",visible:true},
{id:5,name:"Crisp Apples",category:"Fruit",emoji:"🍎",price:5,unit:"bag",stock:8,color:"pink",description:"Crunchy, sweet, and made for sharing.",visible:true},
{id:6,name:"Garden Peppers",category:"Vegetables",emoji:"🫑",price:3,unit:"pair",stock:9,color:"green",description:"Colorful, crisp, and full of garden goodness.",visible:true},
{id:7,name:"Fresh Strawberries",category:"Fruit",emoji:"🍓",price:5.5,unit:"punnet",stock:6,color:"pink",description:"Little berries with big summer sweetness.",visible:true},
{id:8,name:"Fragrant Basil",category:"Herbs",emoji:"🌿",price:2.5,unit:"bunch",stock:15,color:"purple",description:"The perfect finishing touch to a homemade meal.",visible:true}
];
let checkoutDraft={};
let searchQuery="", availableOnly=false, orderFilter="all";
const productArt={1:"tomato",2:"carrot",3:"lettuce",4:"corn",5:"apple",6:"pepper",7:"strawberry",8:"basil"};
const originalEmojis={1:"🍅",2:"🥕",3:"🥬",4:"🌽",5:"🍎",6:"🫑",7:"🍓",8:"🌿"};
let cart={}, nextProductId=9,nextOrderId=1001,activeFilter="All",activeAdminTab="inventory",editingProductId=null,toastTimeout,previousFocus=null,checkoutConfirmed=false;
let orders=[{id:"MF-DEMO",name:"Sample Customer",phone:"Sample contact only",pickup:"Flexible / arrange with farm",notes:"This is an example order to show how the dashboard works.",items:[{name:"Garden Tomatoes",emoji:"🍅",quantity:2,unit:"basket",price:4}],total:8,status:"new",created:new Date(),sample:true}];
const $=(s,root=document)=>root.querySelector(s), $$=(s,root=document)=>Array.from(root.querySelectorAll(s));
const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const safe=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const color=value=>["green","orange","pink","yellow","purple"].includes(value)?value:"green";
const getProduct=id=>products.find(p=>p.id===Number(id));
const count=()=>Object.values(cart).reduce((sum,q)=>sum+q,0);
const total=()=>Object.entries(cart).reduce((sum,[id,qty])=>sum+(getProduct(id)?.price??0)*qty,0);
const statusNames={new:"New",preparing:"Preparing",ready:"Ready for pickup",completed:"Completed"};
function toast(message){const box=$("#toast");box.textContent=message;box.classList.add("visible");clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>box.classList.remove("visible"),3200)}
function renderProducts(){
  const shown=products.filter(p=>p.visible&&(activeFilter==="All"||p.category===activeFilter)&&(!availableOnly||p.stock>0)&&(`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(searchQuery)));
  $("#results-count").textContent=`${shown.length} ${shown.length===1?"item":"items"} shown · example listings`;
  $("#product-grid").innerHTML=shown.length?shown.map((p,index)=>`
  <article class="product-card" style="animation-delay:${Math.min(index*40,240)}ms">
    <div class="product-art ${color(p.color)}"><span class="product-tag ${p.stock===0?"sold-out-tag":""}">${p.stock===0?"Back another day":p.stock<=6?"Small harvest":"FROM THE GARDEN"}</span>${productArt[p.id]&&p.emoji===originalEmojis[p.id]?`<img class="produce-illustration" src="./assets/${productArt[p.id]}.svg" alt="" width="220" height="220" loading="lazy" />`:`<span class="product-emoji" aria-hidden="true">${safe(p.emoji)}</span>`}</div>
    <div class="product-info"><span class="product-category">${safe(p.category)}</span><h3>${safe(p.name)}</h3><p class="product-description">${safe(p.description)}</p>
    <p class="stock-label">${p.stock>0?`${p.stock} available`:"Currently sold out"}${cart[p.id]?` · ${cart[p.id]} in your basket`:""}</p><div class="product-bottom"><span class="product-price">${money(p.price)}<small>per ${safe(p.unit)}</small></span><button type="button" class="add-to-cart" data-add="${p.id}" ${p.stock<=0||(cart[p.id]??0)>=p.stock?"disabled":""} aria-label="Add ${safe(p.name)} to basket">${p.stock===0?"Sold out":(cart[p.id]??0)>=p.stock?"All added":"+ Add"}</button></div></div>
  </article>`).join(""):`<div class="empty-filter">🌱<br/>No matches in the garden listings.<br/>Try a different search or category. <button type="button" class="button button-outline" data-clear-filters>Clear filters</button></div>`;
}
function reconcileCart(){for(const [id,quantity] of Object.entries(cart)){const p=getProduct(id);if(!p||!p.visible||p.stock<1)delete cart[id];else cart[id]=Math.min(quantity,p.stock)}$("#cart-count").textContent=count();
  $("#cart-trigger").setAttribute("aria-label",`Open basket, ${count()} items`);
  $("#basket-summary-count").textContent=`(${count()})`;
  $("#basket-summary-total").textContent=money(total());
  $("#basket-summary").hidden=!count()||!$("#admin-view").hidden||!$("#cart-overlay").hidden;
}
function addToCart(id){const p=getProduct(id);if(!p||!p.visible||p.stock<1){toast("That item isn't available right now.");return}if((cart[id]??0)>=p.stock){toast("You've added all that's available.");return}cart[id]=(cart[id]??0)+1;reconcileCart();checkoutConfirmed=false;renderProducts();toast(p.name+" added to your basket 🧺")}
function adjustCart(id,delta){const p=getProduct(id);if(!p)return;const qty=(cart[id]??0)+delta;if(qty>p.stock){toast("Only "+p.stock+" available in this demo.");return}if(qty<=0)delete cart[id];else cart[id]=qty;reconcileCart();renderProducts();renderCart()}
function openCart(){previousFocus=document.activeElement;reconcileCart();renderCart();$("#cart-overlay").hidden=false;document.body.classList.add("locked");setBackgroundInert(true);$("#basket-summary").hidden=true;$('[data-close-cart].icon-close').focus()}
function closeCart(){if($("#cart-overlay").hidden)return;$("#cart-overlay").hidden=true;document.body.classList.remove("locked");setBackgroundInert(false);reconcileCart();if(previousFocus?.isConnected)previousFocus.focus()}
function renderCart(){
  reconcileCart();const body=$("#cart-body");
  if(checkoutConfirmed){body.innerHTML=`<div class="order-success"><span>🌻</span><h3 tabindex="-1" id="order-success-title">Your test order is in!</h3><p>Your <strong>test request</strong> is now visible in the demo Farmer's Desk. Nothing was sent to the farm, and no pickup has been scheduled.</p><div class="order-reference">${safe(orders[0]?.id??"DEMO")}</div><button type="button" class="button button-forest" data-close-cart>Keep exploring →</button></div>`;return}
  const entries=Object.entries(cart).map(([id,qty])=>({p:getProduct(id),qty})).filter(item=>item.p);
  if(!entries.length){body.innerHTML=`<div class="cart-empty"><span>🧺</span><h3>Your basket's empty.</h3><p>Take a look through the produce listings and add a few items to try the basket.</p><button type="button" class="button button-forest" data-close-cart>Explore the harvest →</button></div>`;return}
  body.innerHTML=`<div class="cart-items">${entries.map(({p,qty})=>`<div class="cart-item"><div class="cart-item-icon" aria-hidden="true">${safe(p.emoji)}</div><div class="cart-item-info"><h3>${safe(p.name)}</h3><small>${money(p.price)} per ${safe(p.unit)}</small><span class="cart-item-price">${money(p.price*qty)}</span></div><div class="quantity-stepper"><button data-cart-adjust="${p.id}" data-delta="-1" type="button" aria-label="Remove one ${safe(p.name)}">−</button><strong>${qty}</strong><button data-cart-adjust="${p.id}" data-delta="1" type="button" ${qty>=p.stock?"disabled":""} aria-label="Add one ${safe(p.name)}">+</button></div></div>`).join("")}</div>
    <div class="cart-total"><span>Estimated total</span><strong>${money(total())}</strong></div>
    <p class="cart-note">Example products and prices. This basket is for trying out the ordering flow only; no pickup is scheduled and no payment is taken.</p>
    <h3 class="checkout-heading">Request a pickup</h3>
    <form class="checkout-form" id="checkout-form">
      <label>Your name<input name="name" maxlength="80" placeholder="Sample name" autocomplete="name" required /></label>
      <label>Phone number<input name="phone" maxlength="30" type="tel" placeholder="Sample phone number" autocomplete="tel" required /></label>
      <label>Preferred pickup time<select name="pickup" required><option value="Flexible / arrange with farm">I'm flexible</option><option value="Weekday morning">Weekday morning</option><option value="Weekday afternoon">Weekday afternoon</option><option value="Weekend">Weekend</option></select></label>
      <label>Anything Ed should know? (optional)<textarea name="notes" maxlength="500" rows="3" placeholder="A note for the farmer..."></textarea></label>
      <p class="checkout-hint">DEMO ONLY — Test with sample details, not real personal information. This request only appears in this browser tab until you refresh.</p>
      <button class="button button-forest checkout-submit" type="submit">Place TEST pickup request →</button>
    </form>`;
  for(const [name,value] of Object.entries(checkoutDraft)){const field=$("#checkout-form").elements.namedItem(name);if(field)field.value=value}

}
function submitOrder(form){
  reconcileCart();if(!count()){toast("Your basket is empty.");renderCart();return}
  const data=new FormData(form),name=String(data.get("name")??"").trim(),phone=String(data.get("phone")??"").trim();
  if(name.length<2||phone.length<5){toast("Please enter a name and phone for this test request.");return}
  const items=Object.entries(cart).map(([id,qty])=>{const p=getProduct(id);return{id:p.id,name:p.name,emoji:p.emoji,qty,unit:p.unit,price:p.price}});
  const amount=total();
  items.forEach(i=>{getProduct(i.id).stock-=i.qty});
  orders.unshift({id:"MF-"+nextOrderId++,name,phone,pickup:String(data.get("pickup")??"Flexible"),notes:String(data.get("notes")??"").trim(),items:items.map(i=>({...i,quantity:i.qty})),total:amount,status:"new",created:new Date(),sample:false});
  cart={};checkoutDraft={};checkoutConfirmed=true;renderProducts();renderCart();renderAdmin();$("#order-success-title").focus();toast("Test order added to the Farmer's Desk!");
}
function renderAdmin(){
  $("#stat-new").textContent=orders.filter(o=>o.status==="new").length;
  $("#stat-products").textContent=products.filter(p=>p.visible&&p.stock>0).length;
  $("#stat-ready").textContent=orders.filter(o=>o.status==="ready").length;
  const newCount=orders.filter(o=>o.status==="new").length;$("#tab-order-badge").textContent=newCount;$("#tab-order-badge").hidden=newCount===0;
  $("#inventory-list").innerHTML=products.length?products.map(p=>`
    <article class="inventory-item"><span class="inventory-thumb" aria-hidden="true">${safe(p.emoji)}</span><div class="inventory-main"><h3>${safe(p.name)} ${!p.visible?'<span class="hidden-pill">Hidden</span>':""}</h3><p>${money(p.price)} per ${safe(p.unit)} · ${safe(p.category)}</p></div>
    <div class="inventory-controls"><div class="stock-control"><span>In stock</span><button type="button" data-stock="${p.id}" data-delta="-1" ${p.stock===0?"disabled":""} aria-label="Decrease stock for ${safe(p.name)}">−</button><strong>${p.stock}</strong><button type="button" data-stock="${p.id}" data-delta="1" aria-label="Increase stock for ${safe(p.name)}">+</button></div><button class="inventory-edit" type="button" data-edit="${p.id}">Edit ✎</button><button class="inventory-delete" type="button" data-remove="${p.id}">Remove</button></div></article>`).join(""):`<p class="orders-empty">No produce added yet. Hit <strong>+ Add produce</strong> to get started!</p>`;
  const shownOrders=orders.filter(o=>orderFilter==="all"||o.status===orderFilter);
  $("#order-list").innerHTML=shownOrders.length?shownOrders.map(o=>{
    const stateClass=["preparing","ready","completed"].includes(o.status)?"state-"+o.status:"";
    return `<article class="order-admin-card"><div class="order-head"><div><small>${safe(o.id)} · ${new Date(o.created).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ${o.sample?"· SAMPLE ORDER":""}</small><h3>${safe(o.name)}</h3></div><span class="order-state ${stateClass}">${safe(statusNames[o.status]??"New")}</span></div>
    <div class="order-details"><div><strong>Customer & pickup</strong><p>📞 ${safe(o.phone)}<br/>🗓 ${safe(o.pickup)}</p>${o.notes?`<p>📝 ${safe(o.notes)}</p>`:""}</div><div><strong>Items requested</strong><ul>${o.items.map(i=>`<li>${safe(i.emoji)} ${i.quantity} × ${safe(i.name)} (${money(i.price*i.quantity)})</li>`).join("")}</ul><p><strong>Total: ${money(o.total)}</strong></p></div></div>
    <div class="order-actions">${o.status==="new"?`<button type="button" class="button button-forest" data-order="${safe(o.id)}" data-status="preparing">Start preparing →</button>`:""}${o.status==="preparing"?`<button type="button" class="button button-forest" data-order="${safe(o.id)}" data-status="ready">Mark ready for pickup ✓</button>`:""}${o.status==="ready"?`<button type="button" class="button button-forest" data-order="${safe(o.id)}" data-status="completed">Mark picked up ✓</button>`:""}${o.status!=="new"&&o.status!=="completed"?`<button type="button" class="button button-outline" data-order="${safe(o.id)}" data-status="new">Move back to new</button>`:""}</div></article>`;
  }).join(""):`<div class="orders-empty"><span>🧺</span><h3>No ${orderFilter==="all"?"":safe(statusNames[orderFilter]).toLowerCase()+" "}orders</h3><p>Orders will appear here when they match this view.</p></div>`;
  switchTab(activeAdminTab);
}
function switchTab(name){activeAdminTab=name==="orders"?"orders":"inventory";["inventory","orders"].forEach(tab=>{const active=tab===activeAdminTab;$("#"+tab+"-panel").hidden=!active;$("#tab-"+tab).classList.toggle("selected",active);$("#tab-"+tab).setAttribute("aria-selected",String(active));$("#tab-"+tab).tabIndex=active?0:-1})}
function openEditor(id=null){
  editingProductId=id;const p=id===null?null:getProduct(id);
  $("#product-form").reset();$("#product-modal-title").textContent=p?"Edit produce":"Add produce";
  $("#field-name").value=p?.name??"";$("#field-category").value=p?.category??"Vegetables";$("#field-emoji").value=p?.emoji??"🥕";
  $("#field-price").value=p?.price??"";$("#field-unit").value=p?.unit??"";$("#field-stock").value=p?.stock??0;
  $("#field-color").value=p?.color??"orange";$("#field-description").value=p?.description??"";$("#field-visible").checked=p?.visible??true;
  $("#product-dialog").showModal();$("#field-name").focus();
}
function saveProduct(form){
  if(!form.reportValidity())return;
  const data=new FormData(form),name=String(data.get("name")??"").trim(),price=Number(data.get("price")),stock=Number(data.get("stock")),unit=String(data.get("unit")??"").trim();
  if(!name||!unit||!Number.isFinite(price)||price<=0||price>9999||!Number.isSafeInteger(stock)||stock<0||stock>99999){toast("Please check the name, price, unit and quantity.");return}
  const fields={name,price:Math.round(price*100)/100,stock,unit,category:String(data.get("category")),emoji:String(data.get("emoji")??"").trim()||"🌱",color:color(data.get("color")),description:String(data.get("description")??"").trim(),visible:data.has("visible")};
  if(editingProductId!==null){Object.assign(getProduct(editingProductId),fields);toast("Produce updated!")}
  else{products.push({id:nextProductId++,...fields});toast("New produce added!")}
  $("#product-dialog").close();reconcileCart();renderAdmin();renderProducts();
}
function enterAdmin(){$("#login-dialog").close();closeCart();$("#storefront").hidden=true;$("#site-footer").hidden=true;$("#admin-view").hidden=false;checkoutConfirmed=false;renderAdmin();reconcileCart();$("#admin-title").focus();window.scrollTo(0,0)}
function leaveAdmin(){$("#admin-view").hidden=true;$("#storefront").hidden=false;$("#site-footer").hidden=false;reconcileCart();$("#back-to-shop").blur();$("#home-link").focus();window.scrollTo(0,0)}
function askAdmin(){closeCart();if(!$("#admin-view").hidden){window.scrollTo(0,0);return}$("#login-dialog").showModal()}
function adjustStock(id,delta){const p=getProduct(id);if(!p)return;p.stock=Math.max(0,Math.min(99999,p.stock+delta));reconcileCart();renderAdmin();renderProducts();const target=$(`[data-stock="${id}"][data-delta="${delta}"]`);if(target&&!target.disabled)target.focus();else $(`[data-stock="${id}"][data-delta="1"]`)?.focus()}
function changeOrder(id,status){const order=orders.find(o=>o.id===id);if(!order)return;const allowed={new:["preparing"],preparing:["ready","new"],ready:["completed","new"],completed:[]};if(!allowed[order.status]?.includes(status))return;order.status=status;renderAdmin();($(`[data-order="${id}"]`)||$("#order-filter")).focus();toast("Order "+id+" is now "+statusNames[status].toLowerCase()+".")}
function removeProduct(id){const p=getProduct(id);if(!p)return;if(!window.confirm('Remove "'+p.name+'" from this demo?'))return;products=products.filter(item=>item.id!==id);delete cart[id];reconcileCart();renderProducts();renderAdmin();toast(p.name+" removed.")}
$("#product-grid").addEventListener("click",e=>{const b=e.target.closest("[data-add]");if(b){const id=b.dataset.add;addToCart(Number(id));$("[data-add=\""+id+"\"]")?.focus()}if(e.target.closest("[data-clear-filters]"))clearFilters()});
$$("[data-filter]").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;$$("[data-filter]").forEach(x=>{x.classList.toggle("active",x===b);x.setAttribute("aria-pressed",String(x===b))});renderProducts()}));
$("#cart-trigger").addEventListener("click",openCart);
$("#cart-overlay").addEventListener("click",e=>{if(e.target.closest("[data-close-cart]")){closeCart();return}const b=e.target.closest("[data-cart-adjust]");if(b){const id=b.dataset.cartAdjust,delta=b.dataset.delta;adjustCart(Number(id),Number(delta));const target=$(`[data-cart-adjust="${id}"][data-delta="${delta}"]`);if(target&&!target.disabled)target.focus();else ($(`[data-cart-adjust="${id}"]`)||$("[data-close-cart].icon-close")).focus()}});
$("#cart-body").addEventListener("input",e=>{if(e.target.name)checkoutDraft[e.target.name]=e.target.value});
$("#cart-body").addEventListener("submit",e=>{if(e.target.id==="checkout-form"){e.preventDefault();submitOrder(e.target)}});
$("#admin-entry").addEventListener("click",askAdmin);$("#footer-admin").addEventListener("click",askAdmin);
$("#close-login").addEventListener("click",()=>$("#login-dialog").close());$("#enter-admin").addEventListener("click",enterAdmin);
$("#back-to-shop").addEventListener("click",leaveAdmin);$("#add-product").addEventListener("click",()=>openEditor());
$("#close-product-dialog").addEventListener("click",()=>$("#product-dialog").close());$("#cancel-product").addEventListener("click",()=>$("#product-dialog").close());
$("#product-form").addEventListener("submit",e=>{e.preventDefault();saveProduct(e.target)});
$$("[data-admin-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.adminTab)));
$("#inventory-list").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.hasAttribute("data-stock"))adjustStock(Number(b.dataset.stock),Number(b.dataset.delta));else if(b.hasAttribute("data-edit"))openEditor(Number(b.dataset.edit));else if(b.hasAttribute("data-remove"))removeProduct(Number(b.dataset.remove))});
$("#order-list").addEventListener("click",e=>{const b=e.target.closest("[data-order]");if(b)changeOrder(b.dataset.order,b.dataset.status)});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#cart-overlay").hidden)closeCart()});
$$('a[href^="#"]').forEach(a=>a.addEventListener("click",()=>{if(!$("#admin-view").hidden)leaveAdmin();closeCart()}));
function setBackgroundInert(value){$$('body > :not(#cart-overlay):not(script):not(.toast)').forEach(el=>{el.inert=value})}
function clearFilters(){searchQuery="";availableOnly=false;activeFilter="All";$("#produce-search").value="";$("#available-only").checked=false;$$('[data-filter]').forEach(b=>{b.classList.toggle("active",b.dataset.filter==="All");b.setAttribute("aria-pressed",String(b.dataset.filter==="All"))});renderProducts();$("#produce-search").focus()}
$("#produce-search").addEventListener("input",e=>{searchQuery=e.target.value.trim().toLowerCase();renderProducts()});
$("#available-only").addEventListener("change",e=>{availableOnly=e.target.checked;renderProducts()});
$("#order-filter").addEventListener("change",e=>{orderFilter=e.target.value;renderAdmin()});
$("#basket-summary").addEventListener("click",openCart);
$$('[data-filter]').forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter==="All")));
const motionPreference=window.matchMedia("(prefers-reduced-motion: reduce)");
let motionPaused=motionPreference.matches;
function updateMotion(){document.body.classList.toggle("motion-paused",motionPaused);$("#motion-toggle").textContent=motionPaused?"Resume animations":"Pause animations";$("#motion-toggle").setAttribute("aria-pressed",String(motionPaused));$("#motion-toggle").disabled=motionPreference.matches;if(motionPreference.matches)$("#motion-toggle").textContent="Reduced motion enabled"}
$("#motion-toggle").addEventListener("click",()=>{motionPaused=!motionPaused;updateMotion()});
motionPreference.addEventListener("change",()=>{motionPaused=motionPreference.matches;updateMotion()});updateMotion();
document.addEventListener("keydown",e=>{if(e.key!=="Tab"||$("#cart-overlay").hidden)return;const focusable=$$('button:not(:disabled),input,select,textarea,a[href]',$(".cart-drawer"));const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
$(".admin-tabs").addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?"inventory":e.key==="End"?"orders":activeAdminTab==="inventory"?"orders":"inventory";switchTab(next);$("#tab-"+next).focus()});
$("#year").textContent=new Date().getFullYear();
renderProducts();reconcileCart();renderAdmin();
