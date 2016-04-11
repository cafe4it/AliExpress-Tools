let importScript = (function (oHead) {
	//window.analytics = analytics;
	function loadError(oError) {
		throw new URIError("The script " + oError.target.src + " is not accessible.");
	}

	return function (sSrc, fOnload) {
		var oScript = document.createElement("script");
		oScript.type = "text\/javascript";
		oScript.onerror = loadError;
		if (fOnload) {
			oScript.onload = fOnload;
		}
		oHead.appendChild(oScript);
		oScript.src = sSrc;
	}

})(document.head || document.getElementsByTagName("head")[0]);

module.exports = importScript;