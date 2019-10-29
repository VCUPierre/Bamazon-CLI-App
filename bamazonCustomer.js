var mySQL = require('mysql');
var inquirer = require('inquirer');
var Table = require('cli-table3');
 
// instantiate
var table = new Table({
    head: ['ID', 'Product Name', 'Department', 'Price', 'Stock']
  , colWidths: [5, 20, 20, 10, 10]
});
 
// table is an Array, so you can `push`, `unshift`, `splice` and friends
/*table.push(
    ['First value', 'Second value']
  , ['First value', 'Second value']
);*/

var connection = mySQL.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "password",
    database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    //console.log("connected as id " + connection.threadId);
    //connection.end();
    getAllItems();
});

function getAllItems(){
    console.log("Getting all Products from bamazon\n");
    var query = connection.query(
        "Select * FROM products",
        function (err, response){
            if (err) throw err;
            console.log('------ Avaliable Products ------');
            //console.log('| ID   | Product_Name           | Price       | Stock         |');
            for (let i = 0; i < response.length; i++){
                table.push([response[i].item_id, response[i].product_name, response[i].department_name , response[i].price.toFixed(2), response[i].stock_quantity]);
                /*if (i >= 9){
                    console.log("| "+JSON.stringify(response[i].item_id) +"   | "+JSON.stringify(response[i].product_name) +" |" + JSON.stringify(response[i].price)+ " |"+ JSON.stringify(response[i].stock_quantity));
                } else {
                    console.log("| "+JSON.stringify(response[i].item_id) +"    | "+JSON.stringify(response[i].product_name)+" |" + JSON.stringify(response[i].price)+ " |"+ JSON.stringify(response[i].stock_quantity));
                }*/
            }
            //console.log('--------------------------------\n');
            console.log(table.toString());
            getItem();
        }
    );
    //console.log(query.sql);
}

function getItem(){
    inquirer.prompt([
        {
            type: "input",
            name: "productID",
            message: "Please type the id of the item you would like to purchase."
        }
    ]).then(function(response){
        //console.log(response.productID);
        //console.log(response.units);
        var query = 'SELECT product_name, price, stock_quantity FROM products WHERE ?'
        connection.query(query, {item_id: response.productID}, function(err, res){
            console.log('You choose the item: '+JSON.stringify(res[0].product_name));
            makePurchase(response.productID, res[0].product_name, res[0].price, res[0].stock_quantity);
        });
    });  
}

function makePurchase(productID, productName, price, stock){
    inquirer.prompt([
        {
            type: "input",
            name: "units",
            message: "How many items would you like to purchase?"
        }
    ]).then(function(response){
        var newStock = stock - response.units;
        if (newStock < 0){
            console.log('sorry not enough available stock');
            continueShopping();
        } else {
            console.log('You just purchased ('+response.units+'):');
            console.log(productName+' at '+price+' each ');
            console.log('x'+response.units)
            console.log('Sales tax...')
            console.log('Total... '+response.units * price);
        
            var query = 'UPDATE products Set ? WHERE ?'
            connection.query(query, [{stock_quantity: parseInt(newStock)},{item_id: parseInt(productID)}], function(err, res){
                console.log('We just charged ... to you card ending in -6789.');
                continueShopping();
            }); 
        }
    });
}
function continueShopping(){
    console.log("would you like to make another purchase?"); // needs to use inquerer
    inquirer.prompt([
        {
            type: "input",
            name: "continueResponse",
            message: "Would you like to continue? (Y or N)"
        }
    ]).then(function(response){
        var response = response.continueResponse;
        if (response.toLowerCase() === 'y'){
            getAllItems();
        } else {
            console.log("Thanks for shopping at BAmazon.node");
            connection.end();
        }
    });
}
