const modernizrConfig = {
	"cache" : true,
	"devFile" : false,
	"dest" : false,
	"options" : [
		"setClasses",
		// "addTest",
		// "html5printshiv",
		// "testProp"
	],
	"uglify" : true,
	"tests" : [],
	"excludeTests": [],
	"crawl" : true,
	"useBuffers": false,
	"files" : {
		"src": [
			"*[^(g|G)runt(file)?].{js,css,scss}",
			"**[^node_modules]/**/*.{js,css,scss}",
			"!lib/**/*"
		]
	},
	"customTests" : []
}

export default modernizrConfig
