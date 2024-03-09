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

    #readBoolean() {
        const index = this.#index;
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

    nextToken() {
        this.#skipWhiteSpaces()
        if (!this.#hasNext()) return new Token("", this.#index, TOKEN_EOF);

        const char = this.#currentChar;
        const index = this.#index + 1;
        this.#next();

        if (isAlpha(char)) return new Token(char, index, TOKEN_IDENTIFIER);
        if (isOperator(char)) return new Token(char, index, TOKEN_OPERATOR);
        if (char === "(") return new Token(char, index, TOKEN_O_PAREN);
        if (char === ")") return new Token(char, index, TOKEN_C_PAREN);
        if (char === "[") return this.#readBoolean();

        return new Token(char, index, TOKEN_ILLEGAL);
    }

    *tokens() {
        let token = this.nextToken();
        while (token.type !== TOKEN_EOF) {
            yield token;
            token = this.nextToken();
        }
        yield token;
    }
}

// Parser
/**
 * 
 * @param {IterableIterator<Token>} tokens 
 */
function parseExpr(tokens) {
    /**
     * @type {Token[]}
     */
    const exprQueue = [];

    /**
     * @type {Token[]}
     */
    const opsStack = [];

    for (const token of tokens) {
        switch (token.type) {
            case TOKEN_IDENTIFIER: exprQueue.push(token); break;
            case TOKEN_O_PAREN: opsStack.push(token); break;
            case TOKEN_BOOLEAN: exprQueue.push(token); break;
            case TOKEN_OPERATOR:
                while (opsStack.length !== 0 && getPrecendence(opsStack[opsStack.length - 1]) >= getPrecendence(token)) {
                    exprQueue.push(opsStack.pop());
                }
                opsStack.push(token);
                break;
            case TOKEN_C_PAREN:
                while (opsStack.length !== 0 && opsStack[opsStack.length - 1].type !== TOKEN_O_PAREN) {
                    exprQueue.push(opsStack.pop());
                }
                opsStack.pop();
                break;
        }
    }

    while (opsStack.length != 0) {
        exprQueue.push(opsStack.pop());
    }

    return exprQueue;
}

/**
 * @param {Token} token 
 */
function getPrecendence(token) {
    switch (token.literal) {
        case "~": return 6;
        case "∧": return 5;
        case "v": return 4;
        case "⊻": return 3;
        case "→": return 2;
        case "↔": return 1;
        default: return 0;
    }
}

/**
 * @param {IterableIterator<Token>} tokens 
 */
function extractvariables(tokens) {
    /**
     * @type {Set<string>}
     */
    const variables = new Set();
    for (const token of tokens) {
        if (isAlpha(token.literal)) variables.add(token.literal);
    }

    return Array.from(variables);
}

/**
 * @param {IterableIterator<Token>} tokens 
 */
function executeExprs(tokens) {
    /**
     * @type {boolean[]}
     */
    let stack = [];
    for (const token of tokens) {
        if (token.type === TOKEN_BOOLEAN) stack.push(token.literal === "true");
        else if (token.type === TOKEN_OPERATOR) {
            if (token.literal === "~") {
                stack.push(!stack.pop());
                continue;
            }

            const right = stack.pop();
            const left = stack.pop();
            switch (token.literal) {
                case "∧": stack.push(left && right); break;
                case "v": stack.push(left || right); break;
                case "⊻": stack.push(left !== right); break;
                case "→": stack.push(!(left && !right)); break;
                case "↔": stack.push(left === right); break;
            }
        }
    }

    return stack.pop();
}

/**
 * @param {IterableIterator<Token>} tokens 
 * @param {string[]} variables 
 * @param {boolean[]} values 
 */
function* replaceIdentifiers(tokens, variables, values) {
    for (const token of tokens) {
        if (token.type === TOKEN_IDENTIFIER) {
            const i = variables.indexOf(token.literal);
            yield new Token(String(values[i]), token.index, TOKEN_BOOLEAN);

        } else {
            yield token;
        }
    }
}

/**
 * @param {IterableIterator<Token>} tokens 
 */
function generateTruthTable(tokens) {
    const variables = extractvariables(tokens);
    /**
     * @type {string[][]}
     */
    const truthTable = [variables];

    for (let i = 2 ** variables.length - 1; i >= 0; i--) {
        /**
         * @type {string[]}
         */
        const row = [];
        /**
         * @type {boolean[]}
         */
        const values = [];

        for (let j = variables.length - 1; j >= 0; j--) {
            const value = !!((i >> j) & 1);
            row.push(value ? "V" : "F");
            values.push(value);
        }

        const result = executeExprs(replaceIdentifiers(tokens, variables, values));
        row.push(result ? "V" : "F");
        truthTable.push(row);
    }

    return truthTable;
}

// Teste do lexer
if (false) {
    const program = "A v (Bv~C) → [false]";
    const lexer = new Lexer(program);

    for (const token of lexer.tokens()) {
        console.log(token);
    }
}

if (true) {
    const program = "A ∧ B v C";
    const lexer = new Lexer(program);
    const tokens = parseExpr(lexer.tokens());
    const truthTable = generateTruthTable(tokens);
    console.log(truthTable);
}