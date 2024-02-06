// Copyright 1999-2024. Plesk International GmbH. All rights reserved.

import { expect, test } from "vitest";
import { OpenApiGenerator } from "../openapi-generator";

test.skip("generator should create openapi", async () => {
  const generator = new OpenApiGenerator("src/examples/jsons");
  const result = await generator.generateOpenApi();
  expect(result.replace(/\s/g, "")).toBe(
    `
    openapi: "3.0.0"
    info:
      title: "API Specification"
      description: "API Specification"
      version: "1.0.0"
    paths:
      /book-list:
        get:
          responses:
            200:
              description: "Description"
              content:
                application/json:
                  schema:
                    $ref: "#/components/schemas/getBookList"
      /summary/overview:
        post:
          responses:
            200:
              description: "Description"
              content:
                application/json:
                  schema:
                    $ref: "#/components/schemas/postSummaryOverview"
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: "object"
                  properties:
                    date:
                      type: "string"
      /users/detail:
        post:
          responses:
            200:
              description: "Description"
              content:
                application/json:
                  schema:
                    $ref: "#/components/schemas/postUsersDetail"
      /users:
        post:
          responses:
            200:
              description: "Description"
              content:
                application/json:
                  schema:
                    $ref: "#/components/schemas/postUsers"
          requestBody:
            required: true
            content:
              application/json:
                schema:
                  type: "object"
                  properties:
                    date:
                      type: "string"
    components:
      schemas:
        getBookList:
          type: "array"
          items:
            type: "object"
            properties:
              name:
                type: "string"
              year:
                type: "string"
              publisher:
                type: "string"
        postSummaryOverview:
          type: "object"
          properties:
            totalSalesOverview:
              type: "object"
              properties:
                totalSales:
                  type: "number"
                monthlyGrowth:
                  type: "number"
                topSellingProduct:
                  type: "string"
            salesByRegion:
              type: "object"
              properties:
                NorthAmerica:
                  type: "number"
                Europe:
                  type: "number"
                AsiaPacific:
                  type: "number"
                RestOfWorld:
                  type: "number"
            productPerformance:
              type: "object"
              properties:
                WidgetX:
                  type: "number"
                WidgetY:
                  type: "number"
                WidgetZ:
                  type: "number"
            salesChannels:
              type: "object"
              properties:
                online:
                  type: "number"
                offline:
                  type: "number"
            customerDemographics:
              type: "object"
              properties:
                newCustomers:
                  type: "number"
                returningCustomers:
                  type: "number"
                averageCustomerAge:
                  type: "number"
                malePercentage:
                  type: "number"
                femalePercentage:
                  type: "number"
            salesFunnel:
              type: "object"
              properties:
                leads:
                  type: "number"
                opportunities:
                  type: "number"
                conversions:
                  type: "number"
                conversionRate:
                  type: "number"
            topPerformingSalesReps:
              type: "object"
              properties:
                JohnDoe:
                  type: "number"
                JaneSmith:
                  type: "number"
                MarkJohnson:
                  type: "number"
            inventoryStatus:
              type: "object"
              properties:
                totalStockValue:
                  type: "number"
                outOfStockItems:
                  type: "number"
                lowStockItems:
                  type: "number"
            customerSatisfaction:
              type: "object"
              properties:
                netPromoterScore:
                  type: "number"
                customerRatings:
                  type: "object"
                  properties:
                    5stars:
                      type: "number"
                    4stars:
                      type: "number"
                    3stars:
                      type: "number"
                    2stars:
                      type: "number"
                    1star:
                      type: "number"
            financialSummary:
              type: "object"
              properties:
                grossProfitMargin:
                  type: "number"
                operatingExpenses:
                  type: "number"
                netProfit:
                  type: "number"
        postUsersDetail:
          type: "object"
          properties:
            userId:
              type: "number"
            username:
              type: "string"
            fullName:
              type: "string"
            email:
              type: "string"
            role:
              type: "string"
            lastLogin:
              type: "string"
        postUsers:
          type: "array"
          items:
            type: "object"
            properties:
              userId:
                type: "number"
              username:
                type: "string"
              fullName:
                type: "string"
              email:
                type: "string"
              role:
                type: "string"
              lastLogin:
                type: "string"
  `.replace(/\s/g, "")
  );
});

test.skip("generate should create openapi with additionalProperties", async () => {
  const generator = new OpenApiGenerator("src/examples/jsons2");
  const result = await generator.generateOpenApi();

  expect(result.replace(/\s/g, "")).toBe(
    `
    openapi: "3.0.0"
    info:
      title: "API Specification"
      description: "API Specification"
      version: "1.0.0"
    paths:
      /test:
        post:
          responses:
            200:
              description: "Description"
              content:
                application/json:
                  schema:
                    $ref: "#/components/schemas/postTest"
    components:
      schemas:
        postTest:
          type: "object"
          properties:
            data:
              type: "object"
              properties:
                summary:
                  type: "object"
                  additionalProperties:
                    type: "array"
                    items:
                      type: "object"
                      properties:
                        name:
                          type: "string"
    `.replace(/\s/g, "")
  );
});
