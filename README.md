# jQuery-liveVal

My jQuery plugin to allow live validation on form elements - uses Twitter Bootstrap v3 tooltip (also works with v2). This is something I created in 2013 for a project and still needs some work - my first jQuery plugin.

## USING THIS PLUGIN
Simple call it on any single input, multiple inputs or block containing inputs (can also check state of checkboxes) - eg. `$(selector).validator(<options>)`

### Options
`options` should be an object used to overwrite the defaults.

#### Defaults
Option | Default value | Description
-------|---------------|-------------
`parentSel` | '.control-group' | Selector used to find where error classes are added to
`missingClass` | 'error' | Class to add when value is missing
`errorClass` | 'warning' | Class to add when there is an error with the input
`required` | false | Set whether an input is required - is also detected from the `required` property
`requiredHtml` | '`<span class="text-error">*</span>`' | HTML to append to label when input is required - if it is missing. Is also removed when required is set to false.
`enableChecker` | true | Set whether checker is enabled

#### Extra
Option | Description
-------|-------------
`check` | The checker that will be used. Can also be detected from the `data-check` property of each input.

### Checker
`check` is the checker to attach to the input's keyup event. The following are build in

Checker | Description
--------|------------
noDigits | Checks that the input does not contain digits (0-9)
noSymbols | Checks that the input does not contain symbols (only letters and digits pass)
isText | Checks that the input does not contain digits, symbols or specials
onlyDigits | Checks that the input contains only digits
isEmail | Checks if input contains a valid email
noSpecial | Check that no special characters are in input
noAlpha | Check that no normal alphabetical characters are in input
isForeign | Filter out foreign (new lines, tabs, ctrl keys) characters
range(<"min"><,"max">) | Check that input is numbers between a min and/or max range
length(<"min"><,"max">) | Check that input is between a min and/or max characters long

### Checks with extra parameters
The extra parameters for checks should be enclosed in round brackets and be given as an object list - `"parameter": value`. It is important that the key be in double quotes.

#### Adding your own checkers
Others can easily be added to `$.fn.validator.checks.(newCheck)`. Example of the `noDigits` check

```javascript
$.fn.validator.checks.noDigits: function(val, addError) {
    if (/\d/.test(val)) {
        addError($.fn[pluginName].errors.noDigits);
        return false;
    }

    return true;
}
```

`val` is the value in the input passed to the check.

`addError` is a callback function used to add the error if the check failed.

The return status is only used by other check to make sure a condition is met before they run, so it is optional.

#### Calling other checkers in a checker and parameters
You can also call one of the build-in checkers or your own as part of any check. Example of the `range` check that does this and that also accepts parameters

```javascript
$.fn.validator.checks.range: function(val, addError, params) {
    if (this.onlyDigits(val, addError)) {
        if (params.min !== undefined && val < params.min) {
            addError($.fn[pluginName].errors.range.min.replace('%d', params.min));
            return false;
        }
        if (params.max !== undefined && val > params.max) {
            addError($.fn[pluginName].errors.range.max.replace('%d', params.max));
            return false;
        }

        return true;
    }

    return false;
}
```
Here it will check that the input is a number (and add the error if it is not), before running the internal checks.

### Changing/Translating the errors
The defaults can be overwritten at `$.fn.validator.errors.(error) = 'new error';` before calling the plugin.

`error` is the name of the error - they follow the naming of the checks. `isText` is the only check that does not have one since it just calls the other check. You can add more for your own checks as well.

## Extra Functions
The following functions might be useful. They can be called on a single, multiple or block containing inputs as follow `$(selector).validator(function<, options>)`

Function | Options | Default | Description
---------|---------|---------|------------
`destroy`| | | Destroy the plugin instances on the matching elements
`enableChecker` | | | Turn the checker on
`disableChecker` | | | Turn the checker off
`setChecker` | checker | | Set or change the checker
`setRequired` | true\|false | true | Change required state of elements
`isValid` | | | Return whether **all** the elements are valid - if one invalid then the whole group is invalid
