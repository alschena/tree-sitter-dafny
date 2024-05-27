const PREC = {
  CALL: 4,
  EXPRESSION: 3,
  LAMBDA: 2,
};

const join1 = (node, separator) => seq(node, repeat(seq(separator, node)));

const curly_wrap = (node) => seq("{", node, "}");

const round_wrap = (node) => seq("(", node, ")");

module.exports = grammar({
  name: "dafny",
  extras: ($) => [/\s+/, $.comment],
  conflicts: ($) => [[$.lambda, $.assignment]],
  rules: {
    source_file: ($) => repeat($._top_level_declaration),

    // Comments are possibly multi-line
    //
    // Header comment starts with '//' and consumes until end of line.
    // The next line can be the continuation of this comment.
    //
    // A line without '//' ends the current comment.
    // To do that we use [ \t] which matches spaces but does not match \n.
    comment: ($) =>
      token(
        seq(
          "//",
          token.immediate(/[^\n]*/),
          token.immediate(/(\n[ \t]*--[^\n]*)*/),
        ),
      ),

    _top_level_declaration: ($) =>
      choice(
        $.method,
        $.function,
        $.predicate,
        $.module,
        $.constant_declaration,
        $.trait,
      ),

    module: ($) =>
      seq(
        "module",
        optional(curly_wrap(repeat1($.opt))),
        $.identifier,
        curly_wrap(repeat($._top_level_declaration)),
      ),

    opt: ($) =>
      seq(token.immediate(":"), $.identifier, choice($._string, $._id)),

    trait: ($) =>
      seq(
        "trait",
        $.identifier,
        optional($.generic),
        optional($.extension),
        curly_wrap(repeat($._top_level_declaration)),
      ),

    generic: ($) => seq("<", join1($.identifier, ","), ">"),
    extension: ($) => seq("extends", join1($.identifier, ",")),

    method: ($) =>
      seq(
        "method",
        $.identifier,
        $.args,
        optional(seq("returns", $.args)),
        repeat($.specification),
        $.body,
      ),

    function: ($) =>
      seq(
        "function",
        $.identifier,
        $.args,
        $._typing,
        repeat($.specification),
        curly_wrap(repeat($.expression)),
      ),

    predicate: ($) =>
      seq("predicate", $.identifier, $.args, repeat($.specification), $.body),

    specification: ($) =>
      choice(
        seq(
          choice(
            "ensures",
            "requires",
            "decreases",
            "invariant",
            "modifies",
            "reads",
          ),
          $.expression,
        ),
        $.forall_spec,
      ),

    forall_spec: ($) =>
      seq(
        "forall",
        seq(
          choice($._id, $._typed_variable, $._constraint_variable),
          "::",
          $.expression,
        ),
      ),

    instruction_forall: ($) => seq("forall", $._constraint_variable, $.body),

    _constraint_variable: ($) =>
      choice(seq($._id, "|", $.expression), seq($._id, "<-", $._id)),

    body: ($) => seq(curly_wrap(repeat($.instruction))),

    instruction: ($) =>
      seq(
        choice(
          seq($.variable_declaration, ";"),
          $.constant_declaration,
          seq($.assignment, ";"),
          $.instruction_conditional,
          $.instruction_loop,
          $.instruction_forall,
          $.instruction_spec,
          seq($.expression, ";"),
          $.label,
          $.return,
          $.yield,
          $.continue,
          $.break,
        ),
      ),

    variable_declaration: ($) =>
      seq("var", choice($._typed_variable, $.assignment)),

    constant_declaration: ($) => seq("const", $.assignment),

    assignment: ($) =>
      seq(
        join1(choice($.identifier, $._typed_variable), ","),
        choice(":=", ":|", ":-"),
        choice(join1(choice($._typed_variable, $.expression, "*"), ",")),
      ),

    _method_call: ($) => prec(PREC.CALL, seq(join1($.identifier, "."), $.args)),

    instruction_conditional: ($) =>
      prec.right(
        choice(
          seq(
            "if",
            choice(round_wrap($._if_condition), $._if_condition),
            $.body,
            "else",
            $.body,
          ),
          seq(
            "match",
            $._id,
            choice(
              curly_wrap(repeat1($._case_statement)),
              repeat1($._case_statement),
            ),
          ),
        ),
      ),

    _case_statement: ($) =>
      prec.right(
        seq("case", $.identifier, "=>", choice(repeat($.instruction), $.body)),
      ),

    _if_condition: ($) =>
      choice($.expression, seq($._typed_variable, "|", $.expression)),

    instruction_loop: ($) =>
      seq(
        choice("while", seq("for", $.assignment, choice("to", "downto"))),
        $.expression,
        $.body,
      ),

    instruction_spec: ($) => seq(choice("assert", "assume"), $.expression, ";"),

    label: ($) =>
      prec.right(
        seq("label", $.identifier, ":", choice($.body, repeat($.instruction))),
      ),

    return: ($) => seq("return", optional(join1($.expression, ",")), ";"),

    yield: ($) => seq("yield", optional(join1($.expression, ",")), ";"),

    continue: ($) => seq("continue", ";"),

    break: ($) => seq("break", ";"),

    expression: ($) =>
      prec(
        PREC.EXPRESSION,
        choice(
          join1($._id, $._infix_operator),
          $._id,
          $._integer,
          $._method_call,
          $.lambda,
          $.allocation,
        ),
      ),

    allocation: ($) => seq("new", $.expression),

    lambda: ($) =>
      prec.left(
        PREC.LAMBDA,
        seq(
          choice(
            round_wrap(join1(choice($._typed_variable, $.identifier), ",")),
            join1(choice($._typed_variable, $.identifier), ","),
          ),
          optional($.specification),
          "=>",
          choice($.expression, curly_wrap($.expression), $.body),
        ),
      ),

    _infix_operator: ($) =>
      choice(
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
        ">>",
      ),

    args: ($) =>
      seq(
        round_wrap(
          optional(join1(choice($._typed_variable, $.expression), ",")),
        ),
      ),

    _typed_variable: ($) => seq($.identifier, $._typing),

    _typing: ($) => seq(":", $.type),

    type: ($) => $._id,

    identifier: ($) => $._id,

    _integer: ($) => seq(optional(token.immediate(choice("-", "+"))), /[0-9]+/),

    _string: ($) => choice(/".*"/, /'.*'/),

    _id: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
