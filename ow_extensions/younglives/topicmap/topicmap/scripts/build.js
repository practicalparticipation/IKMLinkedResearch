//steal/js topicmap/scripts/compress.js

load("steal/rhino/steal.js");
steal.plugins('steal/build','steal/build/scripts','steal/build/styles',function(){
	steal.build('topicmap/scripts/build.html',{to: 'topicmap'});
});
