_NEWLINE_RE = /\r?\n/g
_LINE_BREAK = '<br />'

class window.BBCodeTag
  constructor: (@renderer, settings={}) ->
    @CLOSED_BY = []
    @SELF_CLOSE = false
    @STRIP_INNER = false
    @STRIP_OUTER = false
    @DISCARD_TEXT = false

    @name = settings['name'] or null
    @parent = settings['parent'] or null
    @text = settings['text'] or ''

    if @parent
      @parent.children.push(@)

    settings['params'] ?= []

    @params = {}

    for [key, value] in settings['params']
      if value
        @params[key] = value

    @children = []

  get_content: (raw=false) ->
    pieces = []

    if @text
      text = @renderer.escape(@text)
      
      if not raw
        if @renderer.options['linkify']
          text = @renderer.linkify(text)

        text = @renderer.cosmetic_replace(text.replace(_NEWLINE_RE, _LINE_BREAK))

      pieces.push(text)

    children = @children

    for child in children
      if raw
        pieces.push(child.to_text())
      else
        if @DISCARD_TEXT and child.name is null
          continue

        pieces.push(child.to_html())

    content = pieces.join('')

    if not raw and @STRIP_INNER
        content = @renderer.strip(content)

        while content[0..._LINE_BREAK.length] is _LINE_BREAK
            content = content.slice(_LINE_BREAK.length)

        while content.slice(-_LINE_BREAK.length) is _LINE_BREAK
            content = content.slice(0, -_LINE_BREAK.length)

        content = @renderer.strip(content)

    return content

  to_text: (content_as_html=false) ->
    pieces = []

    if @name isnt null
      if @params.length
        params = ([k, v].join('=') for k, v of @params).join(' ')

        if @name of @params
          pieces.push("[#{params}]")
        else
          pieces.push("[#{@name} #{params}]")
      else
        pieces.push("[#{@name}]")

    pieces.push(@get_content(not content_as_html))

    if @name isnt null and @name not in @CLOSED_BY
      pieces.push("[/#{@name}]")

    pieces.join('')

  _to_html: ->
    [@to_text(true)]

  to_html: ->
    @_to_html().join('')

class CodeBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true

    @_inline = @params['code'] is 'inline'

    if not @_inline
      @STRIP_OUTER = true

  _to_html: ->
      if @_inline
          return ['<code>', @get_content(true), '</code>']

      lang = @params['lang'] or @params[@name]

      if lang
          ["<pre class=\"prettyprint lang-#{lang}\">", @get_content(true), '</pre>']
      else
          ['<pre>', @get_content(true), '</pre>']

class ImageBBCodeTag extends BBCodeTag
  _to_html: ->
    attributes =
      src: @renderer.strip(@get_content(true))

    if 'width' of @params
      attributes['width'] = @params['width']

    if 'height' of @params
      attributes['height'] = @params['height']

    ["<img #{@renderer.html_attributes(attributes)} />"]

class SizeBBCodeTag extends BBCodeTag
  _to_html: ->
    size = @params['size']

    if isNaN(size)
      return @get_content()

    ["<span style=\"font-size:#{size}px\">", @get_content(), '</span>']

class ColorBBCodeTag extends BBCodeTag
  _to_html: ->
    color = @params['color']

    if not color
      return @get_content()

    ["<span style=\"color:#{color}\">", @get_content(), '</span>']

class CenterBBCodeTag extends BBCodeTag
  _to_html: ->
    ['<div style="text-align:center;">', @get_content(), '</div>']

class RightBBCodeTag extends BBCodeTag
  _to_html: ->
    ['<div style="float:right;">', @get_content(), '</div>']

class HorizontalRuleBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @SELF_CLOSE = true
    @STRIP_OUTER = true

  _to_html: ->
    ['<hr />']

class ListBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _to_html: ->
    list_type = @params['list']

    if list_type is '1'
        ['<ol>', @get_content(), '</ol>']
    else if list_type is 'a'
        ['<ol style="list-style-type:lower-alpha;">', @get_content(), '</ol>']
    else if list_type == 'A'
        ['<ol style="list-style-type:upper-alpha;">', @get_content(), '</ol>']
    else
        ['<ul>', @get_content(), '</ul>']

class ListItemBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @CLOSED_BY = ['*', '/list']
    @STRIP_INNER = true

  _to_html: ->
      ['<li>', @get_content(), '</li>']

class QuoteBBCodeTag extends BBCodeTag
  constructor: ->
    super

    @STRIP_INNER = true
    @STRIP_OUTER = true

  _to_html: ->
    pieces = ['<blockquote>', @get_content()]

    citation = @params['quote']

    if citation
      pieces.push('<small>')
      pieces.push(citation)
      pieces.push('</small>')

    pieces.push('</blockquote>')

    return pieces

class LinkBBCodeTag extends BBCodeTag
  _to_html: ->
    url = @renderer.strip(@params[@name] or @get_content(true))

    if /javascript:/i.test(url)
      url = ''
    else if  not /:/.test(url)
      url = 'http://' + url

    if url
      @renderer.context {'linkify': false}, =>
        ["<a href=\"#{url}\" target=\"_blank\">", @get_content(), '</a>']
    else
      [@get_content()]

create_simple_tag = (name, attributes) ->
  class SimpleBBCodeTag extends BBCodeTag
    constructor: ->
      super

      for k ,v of attributes
        @[k] = v

    _to_html: ->
      html_attributes = @renderer.html_attributes(@params)

      if html_attributes
        html_attributes = ' ' + html_attributes

      return ["<#{name}#{html_attributes}>", @get_content(), "</#{name}>"]

window.BBCODE_TAGS =
  b: create_simple_tag('strong')
  i: create_simple_tag('em')
  u: create_simple_tag('u')
  s: create_simple_tag('strike')
  h1: create_simple_tag('h1', {STRIP_OUTER: true})
  h2: create_simple_tag('h2', {STRIP_OUTER: true})
  h3: create_simple_tag('h3', {STRIP_OUTER: true})
  h4: create_simple_tag('h4', {STRIP_OUTER: true})
  h5: create_simple_tag('h5', {STRIP_OUTER: true})
  h6: create_simple_tag('h6', {STRIP_OUTER: true})
  pre: create_simple_tag('pre')
  table: create_simple_tag('table', {DISCARD_TEXT: true})
  thead: create_simple_tag('thead', {DISCARD_TEXT: true})
  tbody: create_simple_tag('tbody', {DISCARD_TEXT: true})
  tr: create_simple_tag('tr', {DISCARD_TEXT: true})
  th: create_simple_tag('th')
  td: create_simple_tag('td')
  code: CodeBBCodeTag
  img: ImageBBCodeTag
  hr: HorizontalRuleBBCodeTag
  size: SizeBBCodeTag
  center: CenterBBCodeTag
  right: RightBBCodeTag
  color: ColorBBCodeTag
  list: ListBBCodeTag
  '*': ListItemBBCodeTag
  quote: QuoteBBCodeTag
  url: LinkBBCodeTag
  link: LinkBBCodeTag