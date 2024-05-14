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

    top_level_declaration: $ => choice (
        $.method,
        // $.function,
        $.predicate
      ),
      // optional($.notes),
      // optional(field('mark', $.header_mark)),
      // 'class',
      // $.class_name,
      // optional($.formal_generics),
      // optional($.obsolete),
      // repeat($.inheritance),
      // repeat($.creation_clause),
      // optional($.converters),
      // repeat($.feature_clause),
      // optional($.invariant),
      // optional($.notes),
      // 'end'

    method: $ => seq (
      "method",
      $.id,
      "(",
      optional($.args),
      ")",
      optional (seq(
        "returns",
        "(",
        $.args,
        ")"
      )),
      optional(repeat($.specs)),
      "{",
      // optional(repeat($.instruction)),
      "}"
    ),

    // function: $ => seq (
    //   "function",
    //   $.id,
    //   "(",
    //   optional($.args),
    //   ")",
    //   $.typing,
    //   optional(repeat($.specs)),
    //   "{",
    //   repeat($.expression),
    //   "}",
    // ),

    predicate: $ => seq (
      "predicate",
      $.id,
      "(",
      optional($.args),
      ")",
      optional(repeat($.specs)),
      "{",
      // repeat($.expression),
      "}",
    ),

    specs: $ => seq (
      choice(
        "ensures",
        "requires",
        "decreases",
        "invariant",
      ),
      $.expression
    ),

    // instruction: $ => seq(
    //   choice(
    //     $.assignment,
    //   ),
    //   ";",
    // ),

    // assignment: $ => seq (
    //   $.id,
    //   ":=",
    //   $.id,
    // ),

    expression: $ => choice(
      $.boolean_expression
      // $.integer_expression,
    ),

    boolean_expression: $ => seq(
      join1($.id,$.boolean_operator)
    ),

    // integer_expression: $ => choice(
    // ),
    boolean_operator: $ => choice (
      "&",
      "<=",
      ">=",
    ),

    // binary_operator: $ => choice(
    //   "+",
    //   "-"
    // ),

    args: $ => join1($.typed_expression, ","),

    typed_expression: $ => seq(
      $.id,
      $.typing
    ),

    typing: $ => seq(
      ":",
      $.type
    ),

    type: $ => $.id,

    id: $ => /[a-zA-Z_][a-zA-Z0-9_]*/
  }
})
