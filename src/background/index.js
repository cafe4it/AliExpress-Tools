import _ from 'lodash';
import async from 'async';

const apiKey = '71737';
const trackingId = 'cheaptoys4xyz';
const promotionLinksTpl = _.template('http://gw.api.alibaba.com/openapi/param2/2/portals.open/api.getPromotionLinks/<%=appKey%>?fields=promotionUrl&trackingId=<%=trackingId%>&urls=<%=requestUrls%>');

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	if (msg.action === 'FETCH_PRODUCTS') {
		let products = msg.data;
		async.waterfall([
			function(cb1){
				async.concat(products,
					function(_product, cb){
						let worker = new Worker(chrome.runtime.getURL('shared/worker.js'));
						worker.onmessage = function (e) {
							_product.responseText = e.data;
							let product = getProduct(_product);
							cb(null, product);
						}
						worker.postMessage(_product.productUrl);
					},function(error, result){
						cb1(error, result);
					});
			},
			function(products, cb2){
				if(products && products.length > 0){
					let requestUrls = _.chain(products).map(function(product){ return product.productUrl}).join(',').value();
					let promotionApi = promotionLinksTpl({
						appKey : apiKey,
						trackingId : trackingId,
						requestUrls : requestUrls
					});
					let worker = new Worker(chrome.runtime.getURL('shared/worker.js'));
					worker.onmessage =  function(e){
						let obj = JSON.parse(e.data);
						cb2(null, obj);
					}
					worker.postMessage(promotionApi);
				}
			}
		], function(error, result){

		})

	}
	return true;
})

let getProduct = (product)=> {
	try{
		var doc = document.implementation.createHTMLDocument("example");
		doc.documentElement.innerHTML = product.responseText;
		let _document = doc.body;
		let _price = (_document.querySelector('span[itemprop="price"]')) ? _document.querySelector('span[itemprop="price"]').innerHTML : null;
		if(!_price){
			_price = (_document.querySelector('span[itemprop="lowPrice"]')) ? _document.querySelector('span[itemprop="lowPrice"]').innerHTML : null;
		}else if(!_price){
			_price = (_document.querySelector('span[itemprop="highPrice"]')) ?_document.querySelector('span[itemprop="highPrice"]').innerHTML : null;
		}
		let _unit = (document.querySelector('.p-unit')) ? document.querySelector('.p-unit').innerHTML.trim() : 'piece';
		let _images = [];
		//console.log(_document);
		let testImages = _document.innerHTML.replace(/(?:\r\n|\r|\n)/g, '').match(/imageBigViewURL\=\[(.*)\]\;window/);
		if(testImages && testImages.length > 1){
			_images = testImages[1].toString().replace(/(?:\")/g, '').split(',');
		}
		let totalOrders = 0;
		let ordersTag = _document.querySelector('#j-order-num');
		if(ordersTag){
			totalOrders = _textToNumber(ordersTag.innerHTML);
		}
		product = _.omit(product, ['responseText']);
		product = _.extend(product, {
			title : _document.querySelector('h1.product-name').innerHTML,
			price : _textToNumber(_price),
			unit : _unit,
			images : _images,
			orders : totalOrders
		});

		return product;
	}catch(ex){
		console.error(ex);
	}
}

let _textToNumber = (str) => {
	return Number(str.replace(/[^0-9\.]+/g, ""));
}