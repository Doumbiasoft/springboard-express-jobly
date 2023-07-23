# Jobly Backend

This is the Express backend for Jobly, version 2.

To run this:

    node server.js
    
To run the tests:

    jest -i

## Part One: Function `sqlForPartialUpdate` in sql.js locate in helpers folder explanation

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

## Part Two: Function `findBy` in company.js locate in model folder explanation

This function has aim to get companies by adding or not some filters.

**Filters:**
```javascript
{
    name:"bauker",
    minEmployees:"24",
    maxEmployees:"225"
}
```
`Filters` must be specified in **`query string`** parameters.
**Example:**
```js
http://localhost:3001/companies?minEmployees=650&maxEmployees=500
```
The function **`findBy`** takes an **Object** an argument:
```Js
/*filter object*/
{ minEmployees, maxEmployees, name }
```
##### This function should:
- Return all companies when no filters are provided
- Filter companies by minEmployees if minEmployees parameter is provided
- Filter companies by maxEmployees if maxEmployees parameter is provided
- Filter companies by both minEmployees and maxEmployees if both parameters are provided
- Filter companies by name if name parameter is provided
- Throw BadRequestError when minEmployees is greater than maxEmployees


## Part Four:
##### NOTE: Research!

>Our database uses the **NUMERIC** field type. Do some research on why we chose this, rather than a **FLOAT** type. Discover what the **pg** library returns when that field type is queried, and form a theory on why.

**Answer:**
The choice to use the **NUMERIC** field type in the **PostgreSQL database** is probably linked to the need for precision, accuracy and consistent results, especially when dealing with financial or critical numerical data. The NUMERIC type ensures that calculations are exact and that significant digits are preserved, and returning data as strings or specific numeric types in the library maintains these properties throughout the application.

##### Function `findBy` in job.js locate in model folder explanation
This function has aim to get job by adding or not some filters.

**Filters:**
```javascript
{
    title:"Inspector",
    minSalary:"75000",
    hasEquity:false
}
```
`Filters` must be specified in **`query string`** parameters.
**Example:**
```js
http://localhost:3001/jobs?title=Inspector&minSalary=75000&hasEquity=false
```
The function **`findBy`** takes an **Object** an argument:
```Js
/*filter object*/
{ title, minSalary, hasEquity }
```
##### This function should:
- Return all jobs when no filters are provided
- Filter jobs by minSalary if minSalary parameter is provided
- Filter jobs by title if title parameter is provided
- Filter jobs by hasEquity if hasEquity parameters is provided
- Filter jobs by all parameters

## Step Five: Job Applications

##### Function `apply` in user.js locate in model folder explanation

This function allow user to apply for a job. This function take two parameters in arguments {username,jobId}
After successfully applying we can now return the user with jobs id list among the user information.