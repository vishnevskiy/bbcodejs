JS_FILES = \
	src/js/bbcode.js \
	src/js/renderer.js \
   	src/js/tags.js \
   	src/js/parser.js \
	src/js/editor.js

all: bbcode.min.js

bbcode.js: ${JS_FILES} Makefile
	cat ${JS_FILES} > $@

bbcode.min.js: bbcode.js
	curl -s --data-urlencode 'js_code@bbcode.js' --data-urlencode 'output_format=text' \
		--data-urlencode 'output_info=compiled_code' http://closure-compiler.appspot.com/compile \
		> $@
