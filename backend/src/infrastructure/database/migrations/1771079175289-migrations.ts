import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1771079175289 implements MigrationInterface {
    name = 'Migrations1771079175289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "planId" character varying(100) NOT NULL, "status" character varying(50) NOT NULL DEFAULT 'active', "stripeSubscriptionId" character varying(255) NOT NULL, "stripeCustomerId" character varying(255) NOT NULL, "currentPeriodStart" TIMESTAMP NOT NULL, "currentPeriodEnd" TIMESTAMP NOT NULL, "dailyLimit" integer NOT NULL, "dailyUsageCount" integer NOT NULL DEFAULT '0', "lastUsageResetDate" character varying(10) NOT NULL DEFAULT '1970-01-01', "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b708d303a3196a61cc88d08931" UNIQUE ("stripeSubscriptionId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
    }

}
