var fs = require('fs');
var file = __dirname + '/md/versions.json';

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }

  versions = JSON.parse(data);

  var XMLWriter = require('xml-writer');
  xw = new XMLWriter;
  xw.startDocument();
  xw.startElement('urlset');
  xw.writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
  xw.writeAttribute('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1');
  xw.writeAttribute('xmlns:video', 'http://www.google.com/schemas/sitemap-video/1.1');

  for (var i = 0; i < versions.length; i++) {
    var currentVersion = versions[i];
    console.log("starting version :"+i);

    var versionFileName = __dirname + '/md/'+currentVersion.path+'/index.json';


     (function(path, i) {
        // enforce a new scope
        var currentPath = path;

            fs.readFile(versionFileName, 'utf8', function (err, data) {
              version = JSON.parse(data);


              flattenedArray = [];

                var content = version.content;

                for (var a = 0; a < content.length; a++) {
                    flattenedArray.push(content[a]);

                    if (content[a].children) {
                        for (var b = 0; b < content[a].children.length; b++) {
                            flattenedArray.push(content[a].children[b]);
                        }
                    }
                }

                for (var x = 0; x < flattenedArray.length; x++) {
                  var entry = flattenedArray[x];
                  entry.fullURL = "http://localhost:8888/#!/docs/"+currentPath+"/"+entry.path;
                  xw.startElement('url');
                  xw.startElement('loc');
                    xw.text(entry.fullURL);
                  xw.endElement();
                  xw.startElement('changefreq');
                    xw.text('weekly')
                  xw.endElement();
                xw.endElement();
                }

              console.log(i + " / " + versions.length);
              if (i == versions.length-1) {
               finishedVersions();
              } 
            });
    })(currentVersion.path, i);
  }
});

function finishedVersions() {
	// urlset
	xw.endElement();
	xw.endDocument();
	console.log(xw.toString());

	var filePath = __dirname +"/sitemap.xml";
	console.log(filePath);

	fs.writeFile(filePath, xw.toString(), function(err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
	}); 
}