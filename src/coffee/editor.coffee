bbcode = @bbcode;

MARKUP =
  bold: # b
    keyCode: 66
    title: 'Bold (Ctrl+B)'
    placeholder: 'bold text'
    open: '[b]'
    close: '[/b]'
  italic: # i
    keyCode: 73
    title: 'Italic (Ctrl+I)'
    placeholder: 'italic text'
    open: '[i]'
    close: '[/i]'
  center: # e
    keyCode: 69
    title: 'Center (Ctrl+E)'
    placeholder: 'center text'
    open: '[center]'
    close: '[/center]'
  hyperlink: # l
    keyCode: 76
    title: 'Hyperlink (Ctrl+L)'
    placeholder: 'link text'
    open: ->
      url = prompt('Please enter the URL of your link', 'http://') || 'link url'
      "[url=#{url}]"
    close: '[/url]'
  blockquote: # .
    keyCode: 190
    title: 'Blockquote (Ctrl+.)'
    placeholder: 'blockquote'
    open: '[quote]'
    close: '[/quote]'
  code: # k
    keyCode: 76
    title: 'Code (Ctrl+K)'
    placeholder: 'print("code sample");'
    open: '[code]'
    close: '[/code]'
  image:
    keyCode: 71
    placeholder: 'image url'
    open: '[img]'
    close: '[/img]'
  nlist:
    keyCode: 79 # o
    title: 'Numbered List (Ctrl+O)'
    placeholder: 'list item'
    open: (value) ->
      open = value.match(/\[list=1\]/g)?.length || 0
      close = value.match(/\[\/list\]/g)?.length || 0
      return '[list=1]\n\t[*]' if open == close
      '\t[*]'
    close: (value) ->
      open = value.match(/\[list=1\]/g)?.length || 0
      close = value.match(/\[\/list\]/g)?.length || 0
      return '\n[/list]' if open == close
  list:
    keyCode: 85 # o
    title: 'Bulleted List (Ctrl+O)'
    placeholder: 'list item'
    open: (value) ->
      open = value.match(/\[list\]/g)?.length || 0
      close = value.match(/\[\/list\]/g)?.length || 0
      return '[list]\n\t[*]' if open == close
      '\t[*]'
    close: (value) ->
      open = value.match(/\[list\]/g)?.length || 0
      close = value.match(/\[\/list\]/g)?.length || 0
      return '\n[/list]' if open == close
  heading:
    keyCode: 72 # h
    title: 'Heading (Ctrl+H)'
    placeholder: 'heading'
    open: '[h3]'
    close: '[/h3]'
    before: /\n$/
    after: /^\n/
  hrule:
    keyCode: 82 # r
    title: 'Hprizontal Rule (Ctrl+R)'
    open: '[hr]\n'
    before: /\n\n$/
    after: /^\n\n/

class @bbcode.Editor
  constructor: (textarea, @markup=MARKUP) ->
    @$ = $(textarea)
    @textarea = @$[0]

    @$.on 'keydown', (e) =>
      if e.which == 9 # Tab
        selection = @getSelection()
        offset = 0

        # If no text is selected and the Shift is not pressed
        # then we just want to insert a tab at the location of
        # the caret.
        if selection.start == selection.end && !e.shiftKey
          offset++
          selection.value[1] = "\t#{selection.value[1]}"
          @setValue selection.value.join ''
        else
          length = 0
          tab = false

          lines = []

          for line in @textarea.value.split '\n'
            [start, end] = [length, length += line.length + 1]

            # Line falls within selection range
            if !tab && start <= selection.start < end
              tab = true

            if tab
              if e.shiftKey
                # Shift is pressed. Untab the line.
                if line[0] == '\t'
                  line = line.slice(1)
                  offset--
              else
                  line = "\t#{line}"
                  offset++

              # Is line still in selection range?
              tab = !(start <= selection.end <= end)

            lines.push line

          @setValue lines.join '\n'

        if offset > 0
          selection.start++
        else if offset < 0
          selection.start--

        @select selection.start, selection.end + offset
      else if !e.ctrlKey || e.altKey || !@getRule(e.which)?
        return true
      else
        @replace e.which

      return false

  _escapeRe: (pattern) ->
    special = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '^', '$']
    escaped = pattern.replace new RegExp('(\\' + special.join('|\\') + ')', 'g'), '\\$1'
    new RegExp('^' +  escaped.replace(/\d+/, '\\d+') + '$');

  getRule: (keyCode) ->
    for key, rule of @markup
      return rule if rule.keyCode == keyCode

  replace: (keyCode, value, text) ->
    @$.focus()

    selection = @getSelection()
    rule = @getRule keyCode
    value = @textarea.value

    open = (if typeof rule.open == 'function' then rule.open(selection.value[0]) else rule.open) || ''
    close = (if typeof rule.close == 'function' then rule.close(selection.value[2]) else rule.close) || ''

    if @_escapeRe(open).test(value.slice(selection.start - open.length, selection.start)) && @_escapeRe(close).test(value.slice(selection.end, selection.end + close.length))
      start = selection.start - open.length

      @setValue value.substr(0, start) + selection.value[1] + value.substr(selection.end + close.length, value.length)
      @select start, start + selection.value[1].length
    else
      replacement = open + (text || selection.value[1] || rule.placeholder || '') + close

      if rule.before? && !rule.before.test(selection.value[0])
        replacement = "\n\n#{replacement}"
        selection.start += 2

      if rule.after? && !rule.after.test(selection.value[2])
        replacement += '\n\n'
        selection.end += 2

      @setValue selection.value[0] + replacement + selection.value[2]
      @select selection.start + open.length, selection.start + replacement.length - close.length

  setValue: (value) ->
    position = @$.scrollTop()
    @$.val value
    @$.scrollTop position

  select: (start, end) ->
    if document.selection?.createRange?
      range = @textarea.createTextRange()
      range.collapse true
      range.moveStart 'character', start
      range.moveEnd 'character', end - start
      range.select()
    else
      @textarea.selectionStart = start
      @textarea.selectionEnd = end

  getSelection: ->
    value = @textarea.value

    if document.selection?.createRange?
      selection = document.selection

      if !/testarea/i.test @textarea.tagName
        range = selection.createRange().duplicate()
        range.moveEnd 'character', value.length

        start = if range.text == '' then value.length else value.lastIndexOf range.text

        range = selection.createRange().duplicate()
        range.moveStart 'character', -value.length

        end = range.text.length + 1
      else
          range = selection.createRange()

          storedRange = range.duplicate()
          storedRange.moveToElementText @textarea
          storedRange.setEndPoint 'EndToEnd', range

          start = storedRange.text.length - range.text.length
          end = start + range.text.length
    else
      start = @textarea.selectionStart
      end = @textarea.selectionEnd

    open = value.substring 0, start
    close = value.substring end, value.length

    selection =
      start: start
      end: end
      value: [open, value.substring(start, end), close]