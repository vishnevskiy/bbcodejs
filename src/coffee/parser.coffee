_SPACE_RE = /^\s*$/
_TOKEN_RE = /(\[\/?.+?\])/
_START_NEWLINE_RE = /^\r?\n/

class window.BBCodeParser
  constructor: (allowed_tags=null) ->
    @tags = {}

    if not allowed_tags
      for name, tag of BBCODE_TAGS
        @register_tag(name, tag)
    else
      for name in allowed_tags
        if name in BBCODE_TAGS
          @register_tag(name, BBCODE_TAGS[name])

    @renderer = new BBCodeRenderer()

  register_tag: (name, tag) ->
    @tags[name] = tag

  _parse_params: (token) ->
    params = []

    if token
      target = key = []
      value = []
      terminate = ' '
      skip_next = false

      for c in token
        if skip_next
          skip_next = false
        else if target is key and c is '='
          target = value
        else if not value.length and c is '"'
          terminate = c
        else if c isnt terminate
          target.push(c)
        else
          params.push([key.join('').toLowerCase(), value.join('')])

          if not _SPACE_RE.test(terminate)
            skip_next = true

          target = key = []
          value = []
          terminate = ' '

      params.push([key.join('').toLowerCase(), value.join('')])

    return params

  _create_text_node: (parent, text) ->
    if parent.children.slice(-1)[0]?.STRIP_OUTER
      text = text.replace(_START_NEWLINE_RE, '')

    new BBCodeTag(@renderer,
      text: text
      parent: parent
    )

  parse: (bbcode) ->
    current = root = new BBCodeTag(@renderer)

    tokens = bbcode.split(_TOKEN_RE)

    while tokens.length
      token = tokens.shift()

      if token.match(_TOKEN_RE)
        params = @_parse_params(token[1...-1])
        tag_name = params[0][0]

        if tag_name in current.CLOSED_BY
          tokens.unshift(token)
          tag_name = '/' + current.name
          params = []

        if tag_name[0] is '/'
          tag_name = tag_name.slice(1)

          if tag_name not of @tags
            @_create_text_node(current, token)
            continue

          if current.name is tag_name
            current = current.parent
        else
          cls = @tags[tag_name]

          if not cls
            @_create_text_node(current, token)
            continue

          tag = new cls(@renderer,
            name: tag_name
            parent: current
            params: params
          )

          if not tag.SELF_CLOSE and (tag_name not in tag.CLOSED_BY or current.name isnt tag_name)
            current = tag
      else
        @_create_text_node(current, token)

    return root

  to_html: (bbcode, prettify=false) ->
    html = @parse(bbcode).to_html()