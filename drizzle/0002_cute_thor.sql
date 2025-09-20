CREATE TABLE "attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attribute_id" uuid NOT NULL,
	"value" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attributes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_type_attributes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_type_id" uuid NOT NULL,
	"attribute_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_type_attributes_product_type_id_attribute_id_unique" UNIQUE("product_type_id","attribute_id")
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "variant_attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"attribute_value_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "variant_attribute_values_variant_id_attribute_value_id_unique" UNIQUE("variant_id","attribute_value_id")
);
--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_color_id_colors_id_fk";
--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_size_id_sizes_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type_id" uuid;--> statement-breakpoint
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_type_attributes" ADD CONSTRAINT "product_type_attributes_attribute_id_attributes_id_fk" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_value_id_attribute_values_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_product_type_id_product_types_id_fk" FOREIGN KEY ("product_type_id") REFERENCES "public"."product_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "color_id";--> statement-breakpoint
ALTER TABLE "product_variants" DROP COLUMN "size_id";