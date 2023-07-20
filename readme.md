# Jobly Backend

This is the Express backend for Jobly, version 2.

To run this:

    node server.js
    
To run the tests:

    jest -i

## Function `sqlForPartialUpdate` explanation

This function helps to generate SQL queries for partial updates in a database.
The function **`sqlForPartialUpdate`** takes two arguments: **`dataToUpdate`** (an `object` containing the data to be updated) and **`jsToSql`** (an `object` that maps **JavaScript** property names to the corresponding **SQL column names**).

It first extracts the **`keys`** from the **`dataToUpdate`** object and checks if there are any **`keys`** available. If there are no **`keys`**, it throws a **`BadRequestError`** with the message `"No data."`

Then, the function **`maps`** each **`key`** from the **`dataToUpdate`** object to it's corresponding **`SQL column`** format using the **`jsToSql`** mapping object. If there's no corresponding mapping for a property, it uses the original property name. For example:
```JS
{firstName: 'Aliya', age: 32} will be mapped to ['"first_name"=$1','"age"=$2'] 

if the jsToSql object contains a mapping like { firstName: 'first_name' }.

The function will returns an object with two properties:

setCols: 
It is a string containing the SQL fragment for the SET clause of an update statement. 
It will look like "first_name"=$1, "age"=$2.

values: 
An array containing the values extracted from the dataToUpdate object.  it will be ['Aliya', 32].
```

>**NB:** The purpose of this code is to facilitate the dynamic generation of SQL queries for updating rows in a database table based on the data provided. The jsToSql mapping is useful for cases where the property names in JavaScript differ from the column names in the database. The code aims to simplify the process of constructing the SQL update statement by handling the column names and values automatically.

