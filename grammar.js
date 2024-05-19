const PREC = {
  CALL: 2,
  EXPRESSION: 2,
};
const join1 = (node, separator)  => seq(
  node,
  repeat(seq(separator, node))
);

module.exports = grammar({
  name: 'dafny',
  extras: $ => [/\s+/, $.comment],
  rules: {
    source_file: $ => repeat($.top_level_declaration),

    // Comments are possibly multi-line
    //
    // Header comment starts with '//' and consumes until end of line.
    // The next line can be the continuation of this comment.
    //
    // A line without '//' ends the current comment.
    // To do that we use [ \t] which matches spaces but does not match \n.
    comment: $ => token(
      seq(
        "//",
        token.immediate(/[^\n]*/),
        token.immediate(/(\n[ \t]*--[^\n]*)*/)
      )
    ),

    top_level_declaration: $ => choice(
        $.method,
        $.function,
        $.predicate,
        $.module,
        $.constant_declaration,
      ),

    module : $ => seq(
      "module",
      "{",
      repeat ($.top_level_declaration),
      "}"
    ),

    method: $ => seq(
      "method",
      $.top_level_name,
      $.args,
      optional(seq(
        "returns",
        $.args,
      )),
      repeat($.specification),
      $.body
    ),

    function: $ => seq(
      "function",
      $.top_level_name,
      $.args,
      $.typing,
      repeat($.specification),
      "{",
      repeat($.expression),
      "}",
    ),

    predicate: $ => seq(
      "predicate",
      $.top_level_name,
      $.args,
      repeat($.specification),
      $.body
    ),

    specification: $ => choice(
      seq(
        choice(
          "ensures",
          "requires",
          "decreases",
          "invariant",
          "modifies",
          "reads",
        ),
        $.expression
      ),
      $.forall_spec,
    ),

    forall_spec: $ => seq(
      "forall",
      choice(
        seq(
          $._id,
          "|",
          $.expression,
        ),
        seq(
          $._id,
          "<-",
          $._id
        ),
      ),
      $.body
    ),

    body: $ => seq(
      "{",
      repeat($.instruction),
      "}"
    ),

    instruction: $ => seq(
      choice(
        seq($.variable_declaration, ";"),
        $.constant_declaration,
        seq ($.assignment, ";"),
        $.instruction_conditional,
        $.instruction_loop,
        $.instruction_spec,
        seq($.method_call, ";"),
        $.return,
        $.yield,
        $.continue,
        $.break,
      ),
    ),

    variable_declaration: $ => seq(
      "var",
      choice(
        $.typed_variable,
        $.assignment,
      ),
    ),

    constant_declaration: $ => seq(
      "const",
      $.assignment,
    ),

    assignment: $ => seq(
      join1(choice(
        $.variable,
        $.typed_variable,
      ), ","),
      choice(
        ":=",
        ":|",
        ":-"
      ),
      choice(
          join1(choice(
          $.typed_variable,
          $.expression,
          $.method_call,
          "*"
        ), ","),
      ),
    ),

    method_call: $ => prec(
      PREC.CALL,
      seq (
      $.top_level_name,
      $.args,
    )),

    instruction_conditional: $ => choice(
      seq(
      "if",
        choice(
          $.expression,
          seq(
            $.typed_variable,
            "|",
            $.method_call,
          ),
        ),
      $.body,
      "else",
      $.body
    ),
      seq("match",
        $._id,
        "{",
        repeat1(seq(
          "case",
          $._id,
          "=>",
          choice (
          $.instruction,
          $.body
        ),
        )),
        "}"
      ),
    ),

    instruction_loop: $ => choice(
      seq(
        "while",
        $.expression,
        $.body,
      ),

    ),

    instruction_spec: $ => seq(
      choice(
        "assert",
        "assume",
      ),
      $.expression,
      ";"
    ),

    return: $ => seq(
      "return",
      optional(join1($.expression, ",")),
      ";"
    ),

    yield: $=> seq(
      "yield",
      optional(join1($.expression, ",")),
      ";"
    ),

    continue: $ => seq(
      "continue",
      ";"
    ),

    break: $ => seq(
      "break",
      ";"
    ),

    expression: $ => prec(
      PREC.EXPRESSION,
      choice(
        join1($._id, $._infix_operator),
        $._id,
      ),
    ),

    _infix_operator: $ => choice (
      "<==>",
      "==>",
      "<==",
      "&&",
      "||",
      "!",
      "==",
      "!=",
      "<",
      "<=",
      ">",
      ">=",
      "!!",
      "in",
      "!in",
      "+",
      "-",
      "*",
      "/",
      "%",
      "|",
      "&",
      "^",
      "<<",
      ">>"
    ),

    args: $ => seq(
      "(",
      optional (join1($.typed_variable, ",")),
      ")",
    ),

    typed_variable: $ => seq(
      $.variable,
      $.typing
    ),

    typing: $ => seq(
      ":",
      $._type
    ),

    _type: $ => $._id,

    variable: $ => $._id,

    top_level_name: $ => $._id,

    _id: $ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
})
