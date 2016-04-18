import _ from 'lodash';
import React from 'react';
import async from 'async';
import ReactFireMixin from 'reactfire';
import FireBase from 'firebase';

//require('expose?jQuery!bootstrap-table/dist/bootstrap-table.min.js');
//require('style!css!bootstrap-table/dist/bootstrap-table.min.css');
_.mixin({
	'findByValues': function (collection, property, values) {
		return _.filter(collection, function (item) {
			return _.includes(values, item[property]);
		});
	}
});

let _textToNumber = (str) => {
    return Number(str.replace(/[^0-9\.]+/g, ""));
}

const categories = [
	{id: 3, name: 'Apparel & Accessories'},
	{id: 34, name: 'Automobiles & Motorcycles'},
	{id: 1501, name: 'Baby Products'},
	{id: 66, name: 'Beauty & Health'},
	{id: 7, name: 'Computer & Networking'},
	{id: 13, name: 'Construction & Real Estate'},
	{id: 44, name: 'Consumer Electronics'},
	{id: 100008578, name: 'Customized Products'},
	{id: 5, name: 'Electrical Equipment & Supplies'},
	{id: 502, name: 'Electronic Components & Supplies'},
	{id: 2, name: 'Food'},
	{id: 1503, name: 'Furniture'},
	{id: 200003655, name: 'Hair & Accessories'},
	{id: 42, name: 'Hardware'},
	{id: 15, name: 'Home & Garden'},
	{id: 6, name: 'Home Appliances'},
	{id: 200003590, name: 'Industry & Business'},
	{id: 36, name: 'Jewelry & Watch'},
	{id: 39, name: 'Lights & Lighting'},
	{id: 1524, name: 'Luggage & Bags'},
	{id: 21, name: 'Office & School Supplies'},
	{id: 509, name: 'Phones & Telecommunications'},
	{id: 30, name: 'Security & Protection'},
	{id: 322, name: 'Shoes'},
	{id: 200001075, name: 'Special Category'},
	{id: 18, name: 'Sports & Entertainment'},
	{id: 1420, name: 'Tools'},
	{id: 26, name: 'Toys & Hobbies'},
	{id: 1511, name: 'Watches'},
]


const outputFields = ['productId', 'productTitle', 'productUrl', 'imageUrl', 'originalPrice', 'salePrice', 'discount', 'evaluateScore', 'commission', 'commissionRate', '30daysCommission', 'volume', 'packageType', 'lotNum', 'validTime', 'localPrice', 'storeName', 'storeUrl'];
const defaultFields = ['productId', 'productTitle', 'productUrl', 'imageUrl', 'originalPrice', 'salePrice', 'discount', 'commission', '30daysCommission', 'volume', 'commissionRate'];
const localCurrency = ["USD", "RUB", "GBP", "BRL", "CAD", "AUD", "EUR", "INR", "UAH", "JPY", "MXN", "IDR", "TRY", "SEK"];
const sortBy = ["orignalPriceUp", "orignalPriceDown", "sellerRateDown", "commissionRateUp", "commissionRateDown", "volumeDown", "validTimeUp", "validTimeDown"];
const pageSizes = [20, 40];

const appKey = '71737';
const trackingId = 'cheaptoys4xyz';
const searchUrlTpl = _.template('http://gw.api.alibaba.com/openapi/param2/2/portals.open/api.listPromotionProduct/<%=appKey%>?fields=<%=fields%>&keywords=<%=keywords%>&categoryId=<%=categoryId%>&localCurrency=<%=localCurrency%>&pageSize=<%=pageSize%>&pageNo=<%=pageNo%>&highQualityItems=<%=highQualityItems%>&sort=<%=sortBy%>');
const productDetailTpl = _.template('http://gw.api.alibaba.com/openapi/param2/2/portals.open/api.getPromotionProductDetail/<%=appKey%>?fields=<%=fields%>&productId=<%=productId%>')
const promotionLinksTpl = _.template('http://gw.api.alibaba.com/openapi/param2/2/portals.open/api.getPromotionLinks/<%=appKey%>?fields=promotionUrl&trackingId=<%=trackingId%>&urls=<%=requestUrls%>');

export default class Home extends React.Component {
	constructor(props) {
		super(props);
		this._doSearch = this._doSearch.bind(this);
		this.__outputFieldsChange = this.__outputFieldsChange.bind(this);
		this.__localCurrencyChange = this.__localCurrencyChange.bind(this);
		this.__pageSizeChange = this.__pageSizeChange.bind(this);
		this.__highQualityChange = this.__highQualityChange.bind(this);
		this.__goToPage = this.__goToPage.bind(this);
		this.state = {
			selectedFields: defaultFields,
			selectedCurrency: 'USD',
			selectedSortBy: 'volumeDown',
			selectedPageSize: 20,
			highQualityItems: false,
			pageNo: 1,
			products: [],
			totalResult: 0,
		}
	}

	_doSearch(e) {
		let _categoryId = this.refs.sltCategories.value;
		let _keywords = this.refs.txtKeywords.value;
		let _fields = this.state.selectedFields.join(',');
		let _localCurrency = this.state.selectedCurrency;
		let _sortBy = this.state.selectedSortBy;
		let _pageSize = this.state.selectedPageSize;
		let _pageNo = this.state.pageNo;
		let _highQualityItems = this.state.highQualityItems;

		let searchUrl = searchUrlTpl({
			appKey: appKey,
			fields: _fields,
			keywords: _keywords,
			categoryId: _categoryId,
			localCurrency: _localCurrency,
			sortBy: _sortBy,
			pageSize: _pageSize,
			pageNo: _pageNo,
			highQualityItems: _highQualityItems
		});
		let self = this;
		async.waterfall([
			function (cb1) {
				$.get(searchUrl, function (res) {
					let products = [];
					let totalResults = 0;
					if (res.errorCode === 20010000) {
						products = (res.result) ? res.result.products : [];
						totalResults = (res.result) ? res.result.totalResults : 0;
					} else {
						products = [];
						totalResults = 0;
					}
					cb1(null, {
						products: products,
						totalResult: totalResults
					})
				})
			},
			function (result, cb2) {
				if (result.products.length <= 0) {
					cb2(null, result);
				} else {
					let requestUrls = _.chain(result.products).map((p)=> {
						return p.productUrl
					}).join(',').value();
					let promotionApi = promotionLinksTpl({
						appKey: appKey,
						trackingId: trackingId,
						requestUrls: requestUrls
					});
					$.get(promotionApi, function (res) {
						let promotionUrls = [];
						if (res.errorCode === 20010000) {
							promotionUrls = res.result.promotionUrls;
						}
						//console.log(promotionUrls.length);
						if (promotionUrls.length > 0) {
							let products = _.map(result.products, (p)=> {
								let _p = _.find(promotionUrls, (pU)=> {
									return pU.url == p.productUrl
								});
								if (_p) p = _.extend(p, {promotionUrl: _p.promotionUrl});

								return _.extend(p,{
                                    volume : _textToNumber(p.volume),
                                    _originalPrice : _textToNumber(p.originalPrice),
                                    _salePrice : _textToNumber(p.salePrice)
                                });
							});
							result = _.extend(result, {products: products});
						}
						cb2(null, result);
					})
				}
			}
		], function (error, result) {
			self.setState(result);
		})

	}


	__outputFieldsChange(e) {
		let selectedFields = this.state.selectedFields;
		let field = e.target.value;
		//let isRequireField = _.some(defaultFields, field);
		if (e.target.checked) {
			selectedFields.push(field);
		} else {
			selectedFields.pop(field);
		}
		this.state.selectedFields = _.uniq(selectedFields);
	}

	__localCurrencyChange(e) {
		this.state.selectedCurrency = e.target.value;
	}

	__sortByChange(e) {
		this.state.selectedSortBy = e.target.value;
	}

	__pageSizeChange(e) {
		this.state.selectedPageSize = e.target.value;
	}

	__highQualityChange(e) {
		this.state.highQualityItems = e.target.checked;
	}

	__goToPage(page) {
		//console.log(i);
		let totalResult = this.state.totalResult;
		let pageSize = this.state.selectedPageSize;
		let totalPage = Math.round(totalResult / pageSize);
		if (page > 0 && page < totalPage) {
			this.setState({pageNo: page}, function () {
				this._doSearch();
			});
		}
	}

	componentDidMount() {
		let defaultValues = _.union(_.concat(this.state.selectedFields, this.state.selectedCurrency, this.state.selectedSortBy));

		defaultValues.map((v)=> {
			$('input[value="' + v + '"]').prop('checked', true);
		})

	}

	render() {
		let ResultSection = (this.state.products.length > 0) ?
			<ResultList totalResult={this.state.totalResult} outputFields={this.state.selectedFields}
			            products={this.state.products} currency={this.state.selectedCurrency} pageNo={this.state.pageNo}
			            pageSize={this.state.selectedPageSize} goToPage={this.__goToPage}/> : '';

		return <div>
			<div className="row">
				<div className="col-md-2">
					<select ref="sltCategories" className="form-control">
						{categories.map((c)=> {
							return <option value={c.id} key={c.id}>{c.name}</option>
						})}
					</select>
				</div>
				<div className="col-md-1">
					<select ref="sltPageSize" className="form-control" onChange={this.__pageSizeChange}>
						{pageSizes.map((p)=> {
							return <option defaultValue={this.state.selectedPageSize} key={p} value={p}>{p}</option>
						})}
					</select>
				</div>
				<div className="col-md-1">
					<label className="checkbox-inline">
						<input type="checkbox" onChange={this.__highQualityChange}/> High Quality
					</label>
				</div>
				<div className="col-md-8">
					<div className="input-group">
						<input type="text" className="form-control" placeholder="Search for..." ref="txtKeywords"/>
                        <span className="input-group-btn">
                            <button className="btn btn-primary" type="button" onClick={this._doSearch}>Search</button>
                        </span>
					</div>
				</div>
			</div>
			<div className="row">
				<div className="col-md-12">
					{outputFields.map((f)=> {
						return <label className="checkbox-inline" key={f}>
							<input type="checkbox" name="outputField" ref="outputField"
							       onChange={this.__outputFieldsChange} value={f}/> {f}
						</label>
					})}
				</div>
			</div>
			<div className="row">
				<div className="col-md-12">
					{localCurrency.map((c)=> {
						return <label className="radio-inline" key={c}>
							<input type="radio" name="localCurrency" onChange={this.__localCurrencyChange}
							       value={c}/> {c}
						</label>
					})}
				</div>
			</div>
			<div className="row">
				<div className="col-md-12">
					{sortBy.map((c)=> {
						return <label className="radio-inline" key={c}>
							<input type="radio" name="sortBy" onChange={this.__sortByChange} value={c}/> {c}
						</label>
					})}
				</div>
			</div>
			{ResultSection}
		</div>
	}
}
const cheapToysDB_Url = 'https://aliexpress.firebaseio.com/sites/cheaptoys4yz/';
const cheapToysDB_ProductsUrl = 'https://aliexpress.firebaseio.com/sites/cheaptoys4yz/products';
const cheapToysDB_ProductUrlTpl = _.template('https://aliexpress.firebaseio.com/sites/cheaptoys4yz/products/<%=productId%>');
const cheapToysDB_products = new FireBase(cheapToysDB_ProductsUrl);

let ResultList = React.createClass({
	__checkAllProductsChange(e){
		let isChecked = e.target.checked;
		let checkboxes = document.querySelectorAll('input[name="chkProduct"]');
		for (let i = 0; i < checkboxes.length; i++) {
			checkboxes[i].setAttribute('checked', isChecked);
		}
	},
	__importToFireBase(e){
		let checkboxes = document.querySelectorAll('input[name="chkProduct"]:checked');
		let products = this.props.products;
		let productIds = _.map(checkboxes, (chk)=> {
			return parseInt(chk.value);
		});
		let _products = _.findByValues(products, 'productId', productIds);

		if (_products.length > 0) {
			_.each(_products, (p)=> {
				let db_product = new FireBase(cheapToysDB_ProductUrlTpl({productId : p.productId}));
				db_product.set(p);
			})
		}
	},
	__toNextPage(e){
		let currentPage = this.props.pageNo;
		this.props.goToPage(++currentPage);
	},
	__toPreviousPage(e){
		let currentPage = this.props.pageNo;
		this.props.goToPage(--currentPage);
	},
	__testDB(){
		/*cheapToysDB_products.on('value', (snapshot)=> {
			console.log(snapshot.val());
		})*/
	},
	render(){

		let products = this.props.products;
		let totalResult = this.props.totalResult;
		let pageSize = this.props.pageSize;
		let currentPage = this.props.pageNo;
		let totalPage = Math.round(totalResult / pageSize);
		let paginationSection = '';
		if (currentPage < totalPage) {
			paginationSection = <div>
				<button className="btn btn-warning" onClick={this.__toPreviousPage}>Prev Page</button>
				&nbsp;
				<span className="bg-success">{`${currentPage}/${totalPage}`}</span>
				&nbsp;
				<button className="btn btn-primary" onClick={this.__toNextPage}>Next Page</button>
			</div>
		}
		return (
			<div className="row">
				<div className="col-md-12">
					<br/>

					<p className="bg-danger">Found : {this.props.totalResult}</p>

					<div className="table-responsive">
						<table className="table" id="tblProducts" data-toggle="table">
							<thead>
							<tr>
								<th><input type="checkbox" ref="chkAllProducts"
								           onChange={this.__checkAllProductsChange}/></th>
								<th>Image</th>
								<th>Currency</th>
								<th>Original Price</th>
								<th>Sale Price</th>
								<th>Commission</th>
								<th>Commission Rate</th>
								<th>30 days commission</th>
								<th>Volume</th>
								<th>Promotion Url</th>
							</tr>
							</thead>
							<tbody>
							{products.map((p)=> {
								return <tr key={p.productId}>
									<td><input type="checkbox" value={p.productId} name="chkProduct"/></td>
									<td><a href={p.productUrl} target="_blank" data-toggle="tooltip"
									       data-placement="right" title={p.productTitle}><img src={p.imageUrl}
									                                                          className="img-responsive"
									                                                          width="100px"/></a></td>
									<td>{this.props.currency}</td>
									<td>{p.originalPrice}</td>
									<td>{p.salePrice}</td>
									<td>{p.commission}</td>
									<td>{p.commissionRate}</td>
									<td>{p['30daysCommission']}</td>
									<td>{p.volume}</td>
									<td>{p.promotionUrl}</td>
								</tr>
							})}
							</tbody>
						</table>
					</div>
					<br/>
					{paginationSection}
					<br/>

					<p>
						<button className="btn btn-success" onClick={this.__importToFireBase}>Import To Firebase
						</button>

						<button className="btn btn-danger" onClick={this.__testDB}>Received Products</button>
					</p>
				</div>
			</div>
		)
	}
})