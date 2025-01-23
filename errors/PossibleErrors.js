export class ErrorCorrespondingMessages {
    constructor(fieldName, code, table, redirect) {
        this.fieldName = fieldName
        this.code = code
        this.table = table
        this.redirect = redirect
    }

    duplicate_possibilities() {
        const duplicate_error_possibilites = {
            "23505-email": {
                field: "phoneEmail",
                message: `მომხმარებელი მეილით უკვე არსებობს.`
            },
            "23505-phone": {
                field: "phoneEmail",
                message: `მომხმარებელი მობილურის ნომრით უკვე არსებობს.`
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
                message: "მობილურის ნომერი არასწორია."
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
        const empty_row_error_possibilities = {
            "4400-email": {
                field: "phoneEmail",
                message: `მომხმარებელი მეილით არ არსებობს.`
            },
            "4400-phone": {
                field: "phoneEmail",
                message: `მომხმარებელი მობილურის ნომრით არ არსებობს.`
            },
            "4400-prof_id": {
                redirect: this.redirect,
                message: `მომხმარებელი პროფილის Id-ით არ არსებობს.`
            },
            "4400-firstname": {
                field: "firstname",
                message: `მომხმარებელი სახელით არ არსებობს.`
            },
            "4400-lastname": {
                field: "lastname",
                message: `მომხმარებელი გვარით არ არსებობს.`
            }
        }

        return empty_row_error_possibilities[`${this.code}-${this.fieldName}`]
    }
}