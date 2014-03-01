#jQuery-liveVal


My jQuery plugin to allow live validation on form elements - uses Twitter Bootstrap v2.3.2 tooltip.

##USING THIS PLUGIN
Simple call it on any single input - multiple not supported, eg. `$('#input-one').validate(options, checker)`

### Options
`Options` should be an object used to overwrite the defaults. The following are the default with description

Option | Default value | Description
-------|---------------|-------------
`errorClassParent` | '.control-group' | The parent element to add the error classes to - on blur
`errorMissingClass` | 'error' | Class to add when value is missing
`errorClass` | 'warning' | Class to add when there is an error with the input
`required` | false | Set whether an input is required
`requiredHtml` | '`<span style="color: red">*</span>`' | HTML to append to label when input is required - after isRequired is called

### Checker
`Checker`(string) is the checker to attach to the input's keyup event. The following is build in

Checker | Description
--------|------------
isText | Checks that the input does not contain digits or symbols
isNumber | Checks that the input contains only digits
isEmail | Checks if input contains a valid email
isAlphaNum | Checks that the input does not contain symbols (only letters and digits pass)

### Adding own checkers
Others can easily be added to `$.fn.validate.checks.(newCheck)`. Example of the isNumber check

```javascript
$.fn.validate.checks.isNumber : function(val) {
                                    var number = /\D/;

                                    if (number.test(val)) return $.fn.validate.errors.onlyDigits;
    
                                    return true;
                                }
```

`val` is the value in the input passed to the check.

Return can be an error string which will be displayed in the tooltip when the check fails or true if it passed - `$.fn.validate.errors.(error)` is where the default error can be overwritten (or translation)


### Changing the errors
The defaults can be overwritten at `$.fn.validate.errors.(error) = 'new error';` in a js file.

`error` is the name of the error and include the following noSymbols, noDigits, onlyDigits and invalidEmail as default. You can at more for your own checks as well.

## Extra Functions
The following functions might be useful. They are all called on a validate jQuery object `$object = $('input').validate()` using `$object.(function)`

Function | Description
---------|------------
setRequired(true or false) | Set whether an input is required
getError | Gets the error of the input (false means no error, 0 means is missing and other text, which will contains the error from the tooltip, means that the input did not pass the check)
