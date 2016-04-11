import '../shared/page.css';
import _ from 'lodash';


$('ul.son-list li').each(function(){
	let item = $(this).find('.item')[0];
	let data = $(this).attr('qrdata');

	if(item && data){
		let productId = data.split('|')[1];
		let productUrlNode = item.querySelector('a.product');
		let productUrl = productUrlNode.getAttribute('href').split('?')[0];
		let _chk = document.createElement('input');
		_chk.type = 'checkbox';
		$(_chk).addClass('chkProduct');
		$(_chk).prop('data-productId', productId);
		$(_chk).prop('data-productUrl', productUrl);
		let _firstChild = item.querySelector('.img.img-border');
		item.insertBefore(_chk, _firstChild);
	}
})

let _container = document.createElement('div');
_container.id = 'get-products-container';

let btnGetProducts = document.createElement('button');
btnGetProducts.id = 'get-products';
btnGetProducts.innerHTML = 'Get Products';
btnGetProducts.setAttribute('class','ui-button ui-button-primary go-contiune-btn');

$(btnGetProducts).on('click',function(e){
	let productIds = [];
	$('input.chkProduct:checked').each(function(){
		productIds.push({
			productId : $(this).prop('data-productId'),
			productUrl : $(this).prop('data-productUrl')
		});
	});
	chrome.runtime.sendMessage({
		action : 'FETCH_PRODUCTS',
		data : productIds
	})
})

let checkBoxAll = document.createElement('input');
checkBoxAll.id = 'chkAll';
checkBoxAll.type = 'checkbox';

$(checkBoxAll).on('click',function(e){
	let isChecked = $(this).prop('checked');
	$('.chkProduct').each(function(){$(this).prop('checked', isChecked)});
})

let label_checkBoxAll = document.createElement('label');
label_checkBoxAll.id='label_chkAll';
label_checkBoxAll.setAttribute('for','chkAll');
let label_checkBoxAll_span = document.createElement('span');
label_checkBoxAll_span.innerHTML = 'Check all';

label_checkBoxAll.appendChild(checkBoxAll);
label_checkBoxAll.appendChild(label_checkBoxAll_span);


_container.appendChild(btnGetProducts);

_container.appendChild(label_checkBoxAll);

let body = document.body.appendChild(_container);
/*let _listCurrency = document.querySelector('#list-currency');
let _parentOfThat = _listCurrency.parentNode;
_parentOfThat.insertBefore(btnGetProducts, _listCurrency.nextSibling);*/
