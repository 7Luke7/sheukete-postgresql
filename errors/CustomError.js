export class CustomError extends Error {
    constructor(code, constraint, table, message) {
        super(message)
        this.code = code
        this.constraint = constraint
        this.table = table
    }
} 