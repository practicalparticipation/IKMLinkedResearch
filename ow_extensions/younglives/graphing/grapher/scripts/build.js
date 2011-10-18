//steal/js grapher/scripts/compress.js

load("steal/rhino/steal.js");
steal.plugins('steal/build','steal/build/scripts','steal/build/styles',function(){
	steal.build('grapher/scripts/build.html',{to: 'grapher'});
});
