function Docs() {

}

Docs.prototype.steps = {};
Docs.prototype.currentPage = null;
Docs.prototype.currentPageLoaded = false;
Docs.prototype.firstPage = null;
Docs.prototype.versions = {};
Docs.prototype.selectedVersion = null;
Docs.prototype.latestVersion = null;
Docs.prototype.currentVersionIdentifier = null;

var root = "docs";

Docs.prototype.loadEntry = function (name) {
      this.currentPage = name;
      // use the Markdown version configured in 'index.json'
      var version = null;

      if (docs.steps[name] === undefined) {
        // if page does not exist, default to first page
        name = docs.firstPage;
      }
      
      version = docs.steps[name].version;

      // if user is not viewing the latest version of the documentation: display warning message
      if (docs.selectedVersion != docs.latestVersion) {
        $('#version_info').show();
      } else {
        $('#version_info').hide();
      }

      // check if provided path is a full path or 'short' path

      var filePath = null;
      var imageRootPath = null;

      if (name.indexOf("/") > -1) {
        // full path
        filePath = "md/"+version+"/"+name+".md"
        var folderComponents = filePath.split("/")
        var folderPath = folderComponents.slice(0, folderComponents.length-1)
        folderPath = folderPath.join('/')
        imageRootPath = folderPath +'/'
      } else {
        // short path
        filePath = "md/"+version+"/"+name+"/"+name+".md"
        imageRootPath = 'md/'+version+'/'+name+'/'
      }

          $.get(filePath, function( data ) {
            var html = markedWithImageRootPath(data, imageRootPath, docs.selectedVersion.path, root);
            var prettify = hljs.highlightAuto(html);
            prettify = hljs.fixMarkup(prettify);
          $('#main_content').html(html);

          $( "pre code" ).each(function( index ) {
            hljs.highlightBlock(this);
          });

          $("html,body").animate({ scrollTop: 0 }, "fast");
      });

      $("#current_guide_title").text(this.steps[name].title);
      $("#indexList li a").css("font-weight", "normal");

      var listEntry = $('#entry-'+this.steps[name].idPath);
      listEntry.css("font-weight", "bold");

      // stetup next and previous buttons
      if (this.steps[name].nextStep) {
          $('#nextTop').attr("href", "#!/"+root+"/"+docs.selectedVersion.path+"/"+this.steps[name].nextStep.path);
          $('#nextTop').css("visibility", "visible");
          $('#nextBottom').attr("href", "#!/"+root+"/"+docs.selectedVersion.path+"/"+this.steps[name].nextStep.path);
          $('#nextBottom').css("visibility", "visible");
      } else {
          $('#nextTop').css("visibility", "hidden");
          $('#nextBottom').css("visibility", "hidden");
      }

      if (this.steps[name].previousStep) {
          $('#previousTop').attr("href", "#!/"+root+"/"+docs.selectedVersion.path+"/"+this.steps[name].previousStep.path);
          $('#previousTop').css("visibility", "visible");
          $('#previousBottom').attr("href", "#!/"+root+"/"+docs.selectedVersion.path+"/"+this.steps[name].previousStep.path);
          $('#previousBottom').css("visibility", "visible");
      } else {
          $('#previousTop').css("visibility", "hidden");
          $('#previousBottom').css("visibility", "hidden");
      }
 
      this.currentPageLoaded = true;
      this.updateURL();
};

Docs.prototype.updateURL = function() {
  location.hash = "#!/"+root+"/"+this.selectedVersion.path+"/"+this.currentPage;
  $("#version_select").val(this.selectedVersion.path);
};

Docs.prototype.loadVersions = function() {
  $.getJSON( "md/versions.json", function( versionsData ) { 

      for (var i = 0; i < versionsData.length; i++) {
        var currentVersion = versionsData[i];
        docs.versions[currentVersion.path] = currentVersion;
        $("<option value="+currentVersion.path+">"+currentVersion.title+"</option>").appendTo("#version_select");
      }

      $('#version_select').change(function() {    
        var item=$(this);
        docs.updateAPIVersion(item.val());
      });

      docs.latestVersion = versionsData[versionsData.length- 1];

      if (docs.currentVersionIdentifier === null) {
        docs.selectedVersion = versionsData[versionsData.length- 1];
        $("#version_select").val(docs.selectedVersion.path);
      } else {
        if (docs.selectedVersion === undefined) {
          docs.selectedVersion = docs.versions[docs.currentVersionIdentifier];
          $("#version_select").val(docs.currentVersionIdentifier);
        }
      }

      docs.parseAPIVersion();
  });
}

Docs.prototype.updateAPIVersion = function(version) {
  if ((this.selectedVersion === null) || (version.localeCompare(this.selectedVersion.path) != 0)) {
          // if version changed, reload
          this.steps = {};
          this.currentPageLoaded = false;
          // set this value in case the available versions have not been loaded yet
          this.currentVersionIdentifier = version;
          this.selectedVersion = this.versions[version];

          $("#version_select").val(version);

          if (this.selectedVersion !== undefined) {
            docs.parseAPIVersion();
            this.updateURL();
          }
  }
};

Docs.prototype.parseAPIVersion = function () {
        var closure = this;

        $.getJSON( "md/"+this.selectedVersion.path+"/index.json", function( data ) { 
                // set previous & next and store array

                flattenedArray = [];

                var content = data.content;

                for (var i = 0; i < content.length; i++) {
                    flattenedArray.push(content[i]);

                    if (content[i].children) {
                        for (var j = 0; j < content[i].children.length; j++) {                            
                            flattenedArray.push(content[i].children[j]);
                        }
                    }
                }

                for (var i = 0; i < flattenedArray.length; i++) {
                    var step = flattenedArray[i];
                    // store id compatible path
                    step.idPath = htmlIdCompatiblePath(step.path)
                    if (!closure.steps[step.path]) {
                        closure.steps[step.path] = step;
                    } else {
                        throw "Naming collision! Two steps have the same path. Duplicate path:"+step.path;
                    }

                    if (i >= 1) {
                        previousStep = flattenedArray[i-1];
                        previousStep.nextStep = step;
                        step.previousStep = previousStep;
                    }
                }


                var source   = $("#list-template").html();
                var template = Handlebars.compile(source);
                var wrapper  = {objects: content, apiversion:closure.selectedVersion.path, docRoot: root};
                var html     = template(wrapper);
                $('#indexContainer').html(html);

                closure.firstPage = flattenedArray[0].path;

                if (closure.currentPageLoaded != true) {
                    if (closure.currentPage != null) {
                      closure.loadEntry(closure.currentPage);
                    } else {
                      closure.loadEntry(closure.firstPage);
                    }
                }
        });
};


var docs = new Docs();

    var re = new RegExp("#\!/" + root + "\/(.*)");

    (function($) {
      var app = $.sammy(function() {

        this.get(re, function() {
            var splat = this.params['splat'];
            var params = splat[0].split('/');
            var version = params[0];
            var name = params.slice(1).join('/');
            docs.currentPage = name;

            docs.updateAPIVersion(version);
            

            if (!docs.steps || !docs.steps[name]) {
              return;
            } else {
              docs.loadEntry(name);
            }
        });  
    });

    $(function() {
        app.run()
      });
    })(jQuery);


    $( document ).ready(function() {
      docs.loadVersions();
    });

function htmlIdCompatiblePath(path) {
  // return path.replace("/","_")
  return path.replace(new RegExp("/", 'g'), "_");
}