export class ErrorCorrespondingMessages {
    constructor(fieldName, code, table, redirect) {
        this.fieldName = fieldName
        this.code = code
        this.table = table
        this.redirect = redirect
    }

    translate_table() {
        const sets = {
            "xelosani": "ხელოსანი",
            "damkveti": "დამკვეთი",
            "users": "მომხმარებელი"
        }

        return sets[this.table]
    }

    duplicate_possibilities() {
        const translated_table = this.translate_table()  
        const duplicate_error_possibilites = {
            "23505-email": {
                field: "phoneEmail",
                message: `${translated_table} მეილით უკვე არსებობს.`
            },
            "23505-phone": {
                field: "phoneEmail",
                message: `${translated_table} ხელოსანი ტელეფონის ნომრით უკვე არსებობს.`
            }
        }

        return duplicate_error_possibilites[`${this.code}-${this.fieldName}`]
    }

    validation_possibilities() {
        const validation_error_possibilities = {
            "23514-email": {
                field: "phoneEmail",
                message: "მეილი არასწორია."
            },
            "23514-phone": {
                field: "phoneEmail",
                message: "ტელეფონის ნომერი არასწორია."
            },
            "23514-firstname": {
                field: "firstname",
                message: "სახელი სავალდებულოა."
            },
            "23514-lastname": {
                field: "lastname",
                message: "გვარი სავალდებულოა."
            }
        }

        return validation_error_possibilities[`${this.code}-${this.fieldName}`]
    }

    empty_row_possibilities() {
        const translated_table = this.translate_table()
        const empty_row_error_possibilities = {
            "4400-email": {
                field: "phoneEmail",
                message: `${translated_table} მეილით არ არსებობს.`
            },
            "4400-phone": {
                field: "phoneEmail",
                message: `${translated_table} ტელეფონის ნომრით არ არსებობს.`
            },
            "4400-prof_id": {
                redirect: this.redirect,
                message: `${translated_table} პროფილის Id-ით არ არსებობს.`
            },
            "4400-firstname": {
                field: "firstname",
                message: `${translated_table} სახელით არ არსებობს.`
            },
            "4400-lastname": {
                field: "lastname",
                message: `${translated_table} გვარით არ არსებობს.`
            }
        }

        return empty_row_error_possibilities[`${this.code}-${this.fieldName}`]
    }
}