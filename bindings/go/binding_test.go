package tree_sitter_dafny_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-dafny"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_dafny.Language())
	if language == nil {
		t.Errorf("Error loading Dafny grammar")
	}
}
