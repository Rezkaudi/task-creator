import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1774267048048 implements MigrationInterface {
    name = 'Migrations1774267048048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ui_library_components" ("id" character varying NOT NULL, "projectId" character varying NOT NULL, "userId" character varying NOT NULL, "name" character varying(255) NOT NULL, "description" text NOT NULL, "designJson" jsonb NOT NULL, "previewImage" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ad4a633618ef6c16da902ea9308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ui_library_projects" ("id" character varying NOT NULL, "name" character varying(255) NOT NULL, "userId" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4701081efdf9a9969d454e7478" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_transactions" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "stripeSessionId" character varying(255) NOT NULL, "stripePaymentIntentId" character varying(255), "packageName" character varying(100) NOT NULL, "pointsPurchased" integer NOT NULL, "amountPaid" integer NOT NULL, "currency" character varying(10) NOT NULL DEFAULT 'usd', "status" character varying(50) NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, CONSTRAINT "UQ_c20ca20d2f305985726922f7b25" UNIQUE ("stripeSessionId"), CONSTRAINT "PK_d32b3c6b0d2c1d22604cbcc8c49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "planId" character varying(100) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'active', "stripeSubscriptionId" character varying(255) NOT NULL, "stripeCustomerId" character varying(255) NOT NULL, "currentPeriodStart" TIMESTAMP NOT NULL, "currentPeriodEnd" TIMESTAMP NOT NULL, "dailyPointsLimit" integer NOT NULL, "dailyPointsUsed" integer NOT NULL DEFAULT '0', "lastUsageResetDate" character varying(10) NOT NULL DEFAULT '1970-01-01', "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b708d303a3196a61cc88d08931" UNIQUE ("stripeSubscriptionId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "design_generations" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "prompt" text NOT NULL, "operationType" character varying(50) NOT NULL, "modelId" character varying(255) NOT NULL, "designSystemId" character varying(255), "conversationHistory" jsonb, "currentDesign" jsonb, "referenceDesign" jsonb, "resultDesign" jsonb, "resultConnections" jsonb, "aiMessage" text, "status" character varying(20) NOT NULL, "errorMessage" text, "inputTokens" integer, "outputTokens" integer, "totalCost" character varying(50), "pointsDeducted" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_974a44e36ba9a3d148d3e6fbf69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_45d0031fb475d715fb9cda116b" ON "design_generations" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_235a856ae66b8da4f70d2bc48b" ON "design_generations" ("userId", "operationType") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fa8368856634b34143a80d367" ON "design_generations" ("userId") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" character varying NOT NULL, "figmaUserId" character varying(255) NOT NULL, "userName" character varying(255), "email" character varying(255), "googleId" character varying(255), "profilePicture" text, "pointsBalance" integer NOT NULL DEFAULT '0', "stripeCustomerId" character varying(255), "hasPurchased" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "UQ_ab9126a074980674ba95d4cd358" UNIQUE ("stripeCustomerId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "client_errors" ("id" character varying NOT NULL, "figmaUserId" character varying(255), "userName" character varying(255), "errorMessage" text NOT NULL, "errorDetails" jsonb, "actionType" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_beed96d4d7b40bd3d239ed6251a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1c81d983a27fae381f8fa79f53" ON "client_errors" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_ead9c1121cd929284079781310" ON "client_errors" ("figmaUserId") `);
        await queryRunner.query(`ALTER TABLE "ui_library_components" ADD CONSTRAINT "FK_c2fdf9b58d9deca80ae5011e480" FOREIGN KEY ("projectId") REFERENCES "ui_library_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ui_library_components" ADD CONSTRAINT "FK_0a9125a205069acc5a1e094bcb4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ui_library_projects" ADD CONSTRAINT "FK_6d5fc0c67b048b27b53a77bbc1a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" ADD CONSTRAINT "FK_60b852936ca1e980cce98d977a2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "design_generations" ADD CONSTRAINT "FK_2fa8368856634b34143a80d3676" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "design_generations" DROP CONSTRAINT "FK_2fa8368856634b34143a80d3676"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`);
        await queryRunner.query(`ALTER TABLE "payment_transactions" DROP CONSTRAINT "FK_60b852936ca1e980cce98d977a2"`);
        await queryRunner.query(`ALTER TABLE "ui_library_projects" DROP CONSTRAINT "FK_6d5fc0c67b048b27b53a77bbc1a"`);
        await queryRunner.query(`ALTER TABLE "ui_library_components" DROP CONSTRAINT "FK_0a9125a205069acc5a1e094bcb4"`);
        await queryRunner.query(`ALTER TABLE "ui_library_components" DROP CONSTRAINT "FK_c2fdf9b58d9deca80ae5011e480"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ead9c1121cd929284079781310"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c81d983a27fae381f8fa79f53"`);
        await queryRunner.query(`DROP TABLE "client_errors"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2fa8368856634b34143a80d367"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_235a856ae66b8da4f70d2bc48b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45d0031fb475d715fb9cda116b"`);
        await queryRunner.query(`DROP TABLE "design_generations"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TABLE "payment_transactions"`);
        await queryRunner.query(`DROP TABLE "ui_library_projects"`);
        await queryRunner.query(`DROP TABLE "ui_library_components"`);
    }

}
