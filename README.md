BBCODE.JS
=========

bbcode.js is a JavaScript BBCode parser and renderer written in CoffeeScript.


Ported from https://github.com/vishnevskiy/bbcodepy!

Usage
-----

``` html
<script src="bbcode.min.js" type="text/javascript"></script>
<script type="text/javascript">
    var html = new BBCodeParser().to_html('[b]Hello![/b]');
</script>
```