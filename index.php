<?php

require_once 'Michelf/Markdown.inc.php';

if ($_GET["_escaped_fragment_"]) {
	$path = $_GET["_escaped_fragment_"];
	$path = str_replace("/cocos2d" , "md" ,$path);
	$articlename = basename($path);
	$path = $path . "/" . $articlename . ".md";
	$fileContent = file_get_contents($path);
	$my_html = Michelf\Markdown::defaultTransform($fileContent);
	echo $my_html;
} else {
	 include_once("docs.html"); 
}

?>