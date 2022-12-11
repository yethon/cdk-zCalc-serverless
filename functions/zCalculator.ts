import { DynamoDB, config } from 'aws-sdk';
import { Handler } from "aws-lambda";
import { Patient, Attribute } from '../lib/z-calc';

// Local dynamo DB
// Use the following config instead when using DynamoDB Local
// config.update({region: 'localhost', endpoint: 'http://localhost:8000', accessKeyId: 'access_key_id', secretAccessKey: 'secret_access_key'});

const region: string = process.env.REGION!;
config.update({ region });
const dynamoDbClient = new DynamoDB();
const TABLE_NAME: string = process.env.TABLE_NAME!;
let successfulMsg = `Z Score calculation was successful!\n\n`;

const buildResponse = (statusCode: number, body: string) => {
  return {
    statusCode: `${statusCode}`,
    body: `${body}`
  }
}

const parseItem = (Item: any) => {
  const L = +Item[`L`].N;
  const M = +Item[`M`].N;
  const S = +Item[`S`].N;

  return { L, M, S }
};

// As per the instructions there are 2 possible formulas
// I'm focusing on the one where L !== 0 for now.
const calculate = (X: number, L: number, M: number, S: number): number | Error => {
  const errorMsg: string = `Z Calculation failed because `;

  if (S === 0) throw new Error(`${errorMsg}S variable was zero`);
  if (L === 0) throw new Error(`${errorMsg}L variable was zero`);

  try {
    const z: number = (((X / M) ** L) - 1) / L * S;
    return z;

  } catch (err) {
    // TODO: This could be streamlined and tuned into a re-usable error handler.
    if (err instanceof Error) {
      throw new Error(`${errorMsg} of reason ${err.message}`);
    } else {
      console.log("Unexpected error ", err);
      throw new Error(`Unknown error : ${errorMsg} of an unkown error`);
    }
  }
}

/**
* As you implement more types of Z Score calculations, you'd use Attribute
* to decide which data to retreive and possibly which formula to use 
* based on whether or not you had a value for L
*/
const calculateZScore = async (patient: Patient, attribute: Attribute) => {
  const { agemos, sex, head_circumference } = patient;

  try {
    const { L, M, S } = await getData(agemos, sex, attribute);
    const zVal = calculate(head_circumference, L, M, S);

    return zVal;

  } catch (err) {
    throw err;
  }
}

const getData = async (agemos: string, sex: string, attribute: Attribute) => {
  try {
    const params = {
      "TableName": `${TABLE_NAME}`,
      "Key": {
        "Agemos": {
          "S": `${agemos}`
        },
        "Sex": {
          "S": `${sex}`
        }
      }
    };
    const { Item } = await dynamoDbClient.getItem(params).promise();

    if (!Item) throw new Error(`Data for ${attribute} not found.`);

    successfulMsg = `${successfulMsg} Data retrieved from DB for Z Score: \n ${JSON.stringify(Item, null, 2)}`;

    return parseItem(Item);

  } catch (error) {
    throw error;
  }
}

/**
 * Lambda Handler function -
*
* Call is made to API Gateway --> lambda function is invoke
*
* Content of queryStringParameters determines which Z Score to calculate
*
* Data for provided parameters is used to retreive the L, M, S values from the DynamoDb Table 
* Error handling needs to happen for:
*
*   1. Existence and validity of query parameters
*   2. Retreival of data from the table
*   3. Execution of formula
*
*   FYI - DynamoDB could be swapped out for an S3 bucket where you sould store CSVs
*   and create a parsing library to extract the data
 */
export const handler: Handler = async (event) => {
  try {
    const { method } = event.requestContext.http;
    // The content queryStringParameters could be used to drive which Z Score the caller wants
    // In this case, they provided circumference and therefore want the Z Score for head circumference.
    const { queryStringParameters } = event;
    const { agemos, sex, head_circumference }: Patient = queryStringParameters;

    if (!agemos || !sex || !head_circumference) return buildResponse(400, `Missing parameters for Z Score: \n agemos: ${agemos} \n sex: ${sex} \n head_circumference: ${head_circumference}`);

    if (method === 'GET') {

      const patient: Patient = { agemos, sex, head_circumference };
      const ZScore = await calculateZScore(patient, `head_circumference`)


      return buildResponse(200, `${successfulMsg} \n \nYour query params were ${JSON.stringify(queryStringParameters, null, 2)} \n\n The Z Score is ${ZScore}`)
    } else {
      return buildResponse(400, `Not a valid operation`);
    }

  } catch (err) {
    // You would never return the details of an error IRL. This is for testing purposes only.
    if (err instanceof Error) {
      return buildResponse(400, `Z Score calculation failed with error message: ${err.message}`);
    } else {
      return buildResponse(400, `Not a valid operation`);
    }
  }
};
