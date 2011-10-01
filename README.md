BBCODE.JS
=========

bbcode.js is a JavaScript BBCode parser and renderer written in CoffeeScript.


Ported from https://github.com/vishnevskiy/bbcodepy!

Usage
-----

All common BBCode tags are supported by default.

``` html
<script type="text/javascript" src="bbcode.min.js"></script>
<script type="text/javascript">var html = new bbcode.Parser().toHTML('[b]Hello![/b]');</script>
```

Add new tags using CoffeeScript's awesome syntax!

``` coffeescript
var parser = @bbcode.Parser();

class YoutubeTag extends @bbcode.Tag
  _toHTML: ->
    attributes =
      src: @renderer.strip(@getContent(true))
      width: @params['width'] or 420
      height: @params['height'] or 315

    "<iframe #{@renderer.htmlAttributes(attributes)} frameborder=\"0\" allowfullscreen></iframe>"

parser.registerTag('youtube', YoutubeTag)

var html = parser.toHTML('[youtube width=420 height=315]http://www.youtube.com/embed/rWTa6OKgWlM[/youtube]')
```