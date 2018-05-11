/**
 * Require dependencies
 *
 */
const program = require('commander'),
    axios = require('axios'),
    Json2csvParser = require('json2csv').Parser,
    fs = require('fs'),
    pkg = require('./package.json');


program
  .version('0.1.0')
  .option('-a, --all', 'All')
  .option('-i, --id <order-id>', 'Order ID')
  .parse(process.argv);


let makeRequest = (uri) => {
	axios.get(uri, { 
		headers: { 'X-AUTHORISATION': 'R4o6rHAvpEhUOmVR' } 
	}).then(response => {
		// Good Request
	    prepareCSV(response.data);
	})
	.catch((error) => {
	    console.log('error ' + error);
	});
}

let prepareCSV = (data) => {
	console.log('-------------------');
	console.log('Saving Data to CSV');
	console.log('-------------------');
	let fields = null, entries = null, filename = null;

	if(data.data.length > 1) {
		fields = ['OrderID','HasCustomerPaid','CustomerName','CustomerEmail'];
		entries = [];

		data.data.forEach((entry) => {
			entries.push({
				'OrderID' : entry.id,
				'HasCustomerPaid' : entry.isPaidFor ? 'Yes' : 'No',
				'CustomerName' : entry.customer.name,
				'CustomerEmail' : entry.customer.email
			})
		});

		filename = 'reports/all-' + Math.floor(Date.now() / 1000);

	} else {
		fields = ['OrderID','HasCustomerPaid','CustomerName','CustomerEmail','NumberOfItemsPurchased','TotalOrder'];
		entries = [{
			'OrderID' : data.data.id,
			'HasCustomerPaid' : data.data.isPaidFor ? 'Yes' : 'No',
			'CustomerName' : data.data.customer.name,
			'CustomerEmail' : data.data.customer.email,
			'NumberOfItemsPurchased' : data.data.items.length,
			'TotalOrder' : null
		}];

		data.data.items.forEach((item) => {
			entries[0].TotalOrder += item.price_in_pennies;
		});

		filename = 'reports/order-' + entries[0].OrderID + '-' + Math.floor(Date.now() / 1000);
	}

	const json2csvParser = new Json2csvParser({ fields });
	const csv = json2csvParser.parse(entries);

	console.log(csv);

	saveCSV(filename, csv);
}

let saveCSV = (filename, csv) => {
	fs.writeFile(filename + '.csv', csv, (err) => {
		// throws an error, you could also catch it here
		if (err) throw err;

		// success case, the file was saved
		console.log('-------------------');
		console.log('CSV saved!');
		console.log('-------------------');
	})
}

if (program.all) {
	makeRequest('https://dummy-api.selesti.agency/orders');
} 

if(program.id) {
	makeRequest('https://dummy-api.selesti.agency/orders/' + program.id);
}

if(!program.id && !program.all) {
	console.log('-------------------');
	console.log('Order App');
	console.log('-------------------');
	console.log('To report on all orders');
	console.log('node index.js --all');
	console.log('-------------------');
	console.log('To report on an order by ID');
	console.log('node index.js --id <Order_ID>');
	console.log('-------------------');
}
