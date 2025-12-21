import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_variations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"options" jsonb,
  	"price" numeric
  );
  
  ALTER TABLE "products" ALTER COLUMN "brand_id" DROP NOT NULL;
  ALTER TABLE "categories_rels" ADD COLUMN "variant_types_id" integer;
  ALTER TABLE "products_variations" ADD CONSTRAINT "products_variations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_variations_order_idx" ON "products_variations" USING btree ("_order");
  CREATE INDEX "products_variations_parent_id_idx" ON "products_variations" USING btree ("_parent_id");
  ALTER TABLE "categories_rels" ADD CONSTRAINT "categories_rels_variant_types_fk" FOREIGN KEY ("variant_types_id") REFERENCES "public"."variant_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categories_rels_variant_types_id_idx" ON "categories_rels" USING btree ("variant_types_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_variations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_variations" CASCADE;
  ALTER TABLE "categories_rels" DROP CONSTRAINT "categories_rels_variant_types_fk";
  
  DROP INDEX "categories_rels_variant_types_id_idx";
  ALTER TABLE "products" ALTER COLUMN "brand_id" SET NOT NULL;
  ALTER TABLE "categories_rels" DROP COLUMN "variant_types_id";`)
}
