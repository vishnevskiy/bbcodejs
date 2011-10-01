_SPACE_RE = /^\s*$/
_TOKEN_RE = /(\[\/?.+?\])/
_START_NEWLINE_RE = /^\r?\n/

class window.BBCodeParser
  constructor: (allowedTags=null) ->
    @tags = {}

    if not allowedTags
      for name, tag of BBCODE_TAGS
        @registerTag(name, tag)
    else
      for name in allowedTags
        if name in BBCODE_TAGS
          @registerTag(name, BBCODE_TAGS[name])

    @renderer = new BBCodeRenderer()

  registerTag: (name, tag) ->
    @tags[name] = tag

  _parseParams: (token) ->
    params = []

    if token
      target = key = []
      value = []
      terminate = ' '
      skipNext = false

      for c in token
        if skipNext
          skipNext = false
        else if target is key and c is '='
          target = value
        else if not value.length and c is '"'
          terminate = c
        else if c isnt terminate
          target.push(c)
        else
          params.push([key.join('').toLowerCase(), value.join('')])

          if not _SPACE_RE.test(terminate)
            skipNext = true

          target = key = []
          value = []
          terminate = ' '

      params.push([key.join('').toLowerCase(), value.join('')])

    return params

  _createTextNode: (parent, text) ->
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
        params = @_parseParams(token[1...-1])
        tagName = params[0][0]

        if tagName in current.CLOSED_BY
          tokens.unshift(token)
          tagName = '/' + current.name
          params = []

        if tagName[0] is '/'
          tagName = tagName.slice(1)

          if tagName not of @tags
            @_createTextNode(current, token)
            continue

          if current.name is tagName
            current = current.parent
        else
          cls = @tags[tagName]

          if not cls
            @_createTextNode(current, token)
            continue

          tag = new cls(@renderer,
            name: tagName
            parent: current
            params: params
          )

          if not tag.SELF_CLOSE and (tagName not in tag.CLOSED_BY or current.name isnt tagName)
            current = tag
      else
        @_createTextNode(current, token)

    return root

  toHTML: (bbcode, prettify=false) ->
    html = @parse(bbcode).toHTML()