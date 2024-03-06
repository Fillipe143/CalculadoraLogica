//Unicode
/**
 * @param {string} char 
 */
function isWhiteSpace(char) {
    return char == " " || char == "\t" || char == "\n";
}

/**
 * @param {string} char 
 */
function isAlpha(char) {
    const code = char.charCodeAt(0);
    return code >= 65 && code <= 90;
}

function isOperator(char) {
    return char === "~" || char === "v" || char === "∧" || char === "→" || char == "↔" || char === "⊻";
}

//Token 
const TOKEN_ILLEGAL = -1;
const TOKEN_EOF = 0;
const TOKEN_IDENTIFIER = 1;
const TOKEN_OPERATOR = 2;
const TOKEN_BOOLEAN = 3;
const TOKEN_O_PAREN = 4;
const TOKEN_C_PAREN = 5;

class Token {
    literal = "";
    index = 0;
    type = 0;

    /**
     * @param {string} literal 
     * @param {number} index 
     * @param {number} type 
     */
    constructor(literal, index, type) {
        this.literal = literal;
        this.index = index;
        this.type = type;
    }
}

// Lexer
class Lexer {
    #index = 0;
    #data = "";
    #currentChar = "";

    /**
     * @param {string} data 
     */
    constructor(data) {
        this.#index = 0;
        this.#data = data;
        this.#currentChar = data[0];
    }

    #hasNext() {
        return this.#index < this.#data.length;
    }

    #next() {
        if (this.#hasNext()) {
            this.#index++;
            this.#currentChar = this.#data[this.#index];
        }
    }

    #skipWhiteSpaces() {
        while (this.#hasNext() && isWhiteSpace(this.#currentChar)) {
            this.#next();
        }
    }

    nextToken() {
        this.#skipWhiteSpaces()
        if (!this.#hasNext()) return new Token("", this.#index, TOKEN_EOF);

        const char = this.#currentChar;
        const index = this.#index + 1;
        this.#next();

        if (isAlpha(char)) return new Token(char, index, TOKEN_IDENTIFIER);
        if (isOperator(char)) return new Token(char, index, TOKEN_OPERATOR);
        if (char === "(") return new Token(char, index, TOKEN_O_PAREN);
        if (char === ")") return new Token(char, index, TOKEN_O_PAREN);
        if (char === "[") return this.#readBoolean();

        return new Token(char, index, TOKEN_ILLEGAL);
    }

    #readBoolean() {
        const index = this.#index - 1;
        let literal = "";

        while (this.#hasNext() && this.#currentChar !== "]") {
            literal += this.#currentChar;
            this.#next();
        }

        if (this.#currentChar === "]") {
            this.#next();
            if (literal === "true" || literal === "false") return new Token(literal, index, TOKEN_BOOLEAN)
        }

        return new Token(`[${literal}`, index, TOKEN_ILLEGAL)
    }
}

// Linter
class Node { }

class ExpNode {
    /**
     * @type {string}
     */
    value;

    /**
     * @param {string} value 
     */
    constructor(value) {
        this.value = value;
    }
}

class OpNode extends Node {
    /**
     * @type {Node}
     */
    right;

    /**
     * @type {Node}
     */
    left;

    /**
     * @type {number}
     */
    operation;

    /**
     * @param {Node} right 
     * @param {Node} left 
     */
    constructor(operation, right, left) {
        this.operation = operation;
        this.right = right;
        this.left = left;
    }
}

class Linter {
    /**
     * @type {Lexer}
     */
    #lexer;

    /**
     * @param {Lexer} lexer 
     */
    constructor(lexer) {
        this.#lexer = lexer;
    }

    generateAST() {

    }
}

// Teste do lexer
{
    const program = "A v (Bv~C) [false]";
    const lexer = new Lexer(program);

    let token = lexer.nextToken();

    while (token.type !== TOKEN_EOF) {
        console.log(token);
        token = lexer.nextToken();
    }
}

// Teste do Linter
{

}