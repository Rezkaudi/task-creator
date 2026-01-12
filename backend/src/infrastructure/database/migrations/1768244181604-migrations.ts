import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1768244181604 implements MigrationInterface {
    name = 'Migrations1768244181604'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" character varying NOT NULL, "figmaUserId" character varying(255) NOT NULL, "userName" character varying(255), "email" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6f9a8d42f89668e50176c77c0c8" UNIQUE ("figmaUserId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "design_versions" DROP CONSTRAINT "PK_b345ead815e872449e8d358f317"`);
        await queryRunner.query(`ALTER TABLE "design_versions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD "id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD CONSTRAINT "PK_b345ead815e872449e8d358f317" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD CONSTRAINT "FK_f9e62b38050bcc8e93271a5b066" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "design_versions" DROP CONSTRAINT "FK_f9e62b38050bcc8e93271a5b066"`);
        await queryRunner.query(`ALTER TABLE "design_versions" DROP CONSTRAINT "PK_b345ead815e872449e8d358f317"`);
        await queryRunner.query(`ALTER TABLE "design_versions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "design_versions" ADD CONSTRAINT "PK_b345ead815e872449e8d358f317" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "design_versions" DROP COLUMN "userId"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
