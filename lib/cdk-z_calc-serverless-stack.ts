import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as dotenv from 'dotenv';
import path = require('path');
dotenv.config();

export class CdkZCalcServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    // FYI - This table already exists, you'd do something else if you were creating it here.
    const table = Table.fromTableArn(this, `${process.env.TABLE_NAME}`, `${process.env.TABLE_ARN}`);

    // Lamda Function
    const lFunc = new NodejsFunction(this, "ZCalculator", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../functions/zCalculator.ts'),
      handler: "handler",
      environment: {
        TABLE_NAME: table.tableName
      }
    })

    table.grantReadData(lFunc);

    // API Gateway
    const lUrl = lFunc.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
      }
    });

    new CfnOutput(this, 'lUrl', {
      value: lUrl.url,
    });
  }
}
