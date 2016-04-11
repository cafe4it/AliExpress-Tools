onmessage = function(e){
	var url = e.data;
	fetch(url).then(function(response){
		var contentType = response.headers.get("content-type");
		if(contentType && contentType.indexOf("application/json") !== -1){
			return response.json();
		}else{
			return response.text();
		}
	}).then(function(body){
		postMessage(body);
	})
}