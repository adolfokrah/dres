import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "variant_options_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"main_categories_id" integer
  );
  
  ALTER TABLE "variant_options_rels" ADD CONSTRAINT "variant_options_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."variant_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variant_options_rels" ADD CONSTRAINT "variant_options_rels_main_categories_fk" FOREIGN KEY ("main_categories_id") REFERENCES "public"."main_categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "variant_options_rels_order_idx" ON "variant_options_rels" USING btree ("order");
  CREATE INDEX "variant_options_rels_parent_idx" ON "variant_options_rels" USING btree ("parent_id");
  CREATE INDEX "variant_options_rels_path_idx" ON "variant_options_rels" USING btree ("path");
  CREATE INDEX "variant_options_rels_main_categories_id_idx" ON "variant_options_rels" USING btree ("main_categories_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "variant_options_rels" CASCADE;`)
}
