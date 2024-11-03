import { ErrorCorrespondingMessages } from "./PossibleErrors.js";

export class PostgresErrorHandler {
    constructor(code, constraint, table, redirect) {
        this.code = code
        this.constraint = constraint
        this.table = table
        this.redirect = redirect || null
    }
    
    identify_error() {
        switch (this.code) {
            case "23514": 
                return this.validation_error()
            case "23505":
                return this.duplicate_error()
            case "4400":
                return new ErrorCorrespondingMessages(this.constraint, this.code, this.table, this.redirect).empty_row_possibilities()
            default:
                this.unexpected_error()
        }
    }

    identify_field() {
        const possible_fields = ["phone", "email", "firstname", "lastname"]
        for (let i = 0; i < possible_fields.length; i++) {
            if (this.constraint.includes(possible_fields[i])) {
                return possible_fields[i]
            }
        }
    }

    validation_error() {
        const field = this.identify_field()
        return new ErrorCorrespondingMessages(field, this.code).validation_possibilities()        
    }

    duplicate_error() {
        const field = this.identify_field()
        return new ErrorCorrespondingMessages(field, this.code, this.table).duplicate_possibilities()
    }

    unexpected_error() {
        console.log(this.code, this.constraint)
    }
}