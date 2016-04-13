import React from 'react';
import {Table, Column, Cell} from 'fixed-data-table';
import async from 'async';
require('style!css!fixed-data-table/dist/fixed-data-table.min.css');
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
						products = res.result.products;
						totalResults = res.result.totalResults;
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
					console.log(promotionUrls.length);
					if (promotionUrls.length > 0) {
						let products = _.map(result.products, (p)=> {
							let _p = _.find(promotionUrls, (pU)=> {
								return pU.url == p.productUrl
							});
							if (_p) p = _.extend(p, {promotionUrl : _p.promotionUrl});
							return p;
						});
						result = _.extend(result, {products: products});
					}
					cb2(null, result);
				})
				/*async.concat(result.products,
				 function (productId, cb21) {
				 let productDetailRequest = productDetailTpl({
				 appKey: appKey,
				 fields: _fields,
				 productId: productId
				 });
				 $.get(productDetailRequest, function (res) {
				 if (res.errorCode === 20010000) {
				 cb21(null, res.result);
				 }
				 })
				 },
				 function (error, products) {
				 cb2(error, {
				 totalResult: result.totalResult,
				 products: products
				 })
				 })*/
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
			            pageSize={this.state.selectedPageSize}/> : '';

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

let ResultList = React.createClass({
	__checkAllProductsChange(e){
		let isChecked = e.target.checked;
		$('input[name="chkProduct"]').map(()=> {
			$(this).prop('chẹcked', isChecked);
		})
	},
	render(){

		let products = this.props.products;
		let totalResult = this.props.totalResult;
		let pageSize = this.props.pageSize;
		let currentPage = this.props.pageNo;
		let totalPage = Math.round(totalResult / pageSize);
		let paginationSection = '';
		if (currentPage < totalPage) {

		}
		return (
			<div className="row">
				<div className="col-md-12">
					<br/>

					<p className="bg-danger">Found : {this.props.totalResult}</p>

					<div className="table-responsive">
						<Table
							rowsCount={products.length}
							rowHeight={100}
							width={1140}
							height={500}
							headerHeight={30}
							>
							<Column
								header={<Cell><input type="checkbox" ref="chkAllProducts" onChange={this.__checkAllProductsChange}/></Cell>}
								cell={props => (<Cell {...props}>
								<input type="checkbox" value={products[props.rowIndex].productId} name="chkProduct"/>
							</Cell>)} width={50}/>
							<Column cell={props => (<Cell {...props}>
								<span className="text-center">{props.rowIndex}</span>
							</Cell>)} width={50}/>
							<Column header={<Cell>Image</Cell>} cell={props => (<Cell {...props}>
							<a href={products[props.rowIndex].productUrl} target="_blank" data-toggle="tooltip" data-placement="right" title={products[props.rowIndex].productTitle}><img src={products[props.rowIndex].imageUrl} className="img-responsive"/></a>
							</Cell>)} width={100}/>
							<Column cell={props => (<Cell {...props}>
							<b className="bg-primary">{this.props.currency}</b>
							</Cell>)} width={50}/>
							<Column header={<Cell>Original Price</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex].originalPrice}
							</Cell>)} width={100}/>
							<Column header={<Cell>Sale Price</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex].salePrice}
							</Cell>)} width={100}/>
							<Column header={<Cell>Commission</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex]['commission']}
							</Cell>)} width={100}/>
							<Column header={<Cell>Commission Rate</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex].commissionRate}
							</Cell>)} width={100}/>
							<Column header={<Cell>30 days</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex]['30daysCommission']}
							</Cell>)} width={100}/>
							<Column header={<Cell>Volume</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex].volume}
							</Cell>)} width={100}/>
							<Column header={<Cell>Promotion Url</Cell>} cell={props => (<Cell {...props}>
								{products[props.rowIndex].promotionUrl}
							</Cell>)} width={200}/>
						</Table>
					</div>
					<br/>

					<p>
						<button className="btn btn-primary">Next Page</button>
					</p>
				</div>
			</div>
		)
	}
})