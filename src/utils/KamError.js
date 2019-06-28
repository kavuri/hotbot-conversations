/* Copyright (C) Kamamishu Pvt. Ltd. - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

 'using strict';

 class KamError extends Error {
     constructor(message, code) {
        super(message);
        this.code = code;
     }
 }

 class InputError extends KamError {
     constructor(message) {
         this.super(message, 100);
     }
 }
 
 class DBError extends KamError {
     constructor(message) {
         this.super(this.message, 101);
     }
 }

 class FacilityDoesNotExistError extends KamError {
     constructor(message) {
         this.super(message, 102)
     }
 }

 module.exports = {
     InputError: InputError,
     DBError: DBError,
     FacilityDoesNotExistError: FacilityDoesNotExistError
 };
 