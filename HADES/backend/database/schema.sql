-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    first_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    cedula character varying(20) COLLATE pg_catalog."default" NOT NULL,
    birth_date date NOT NULL,
    phone character varying(20) COLLATE pg_catalog."default" NOT NULL,
    address character varying(200) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(20) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    estado character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'activo'::character varying,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_cedula_key UNIQUE (cedula),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['admin'::character varying, 'mesero'::character varying, 'cliente'::character varying]::text[])),
    CONSTRAINT chk_age CHECK (date_part('year'::text, age(birth_date::timestamp with time zone)) >= 18::double precision),
    CONSTRAINT users_estado_check CHECK (estado::text = ANY (ARRAY['activo'::character varying::text, 'inactivo'::character varying::text, 'eliminado'::character varying::text]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;

-- Table: public.dishes

-- DROP TABLE IF EXISTS public.dishes;

CREATE TABLE IF NOT EXISTS public.dishes
(
    id integer NOT NULL DEFAULT nextval('dishes_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    price numeric(10,2) NOT NULL,
    available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    image_url text COLLATE pg_catalog."default",
    created_by integer,
    category character varying(50) COLLATE pg_catalog."default" NOT NULL DEFAULT 'plato'::character varying,
    quantity integer DEFAULT 0,
    CONSTRAINT dishes_pkey PRIMARY KEY (id),
    CONSTRAINT dishes_created_by_fkey FOREIGN KEY (created_by)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT dishes_category_check CHECK (category::text = ANY (ARRAY['plato'::character varying, 'bebida'::character varying, 'postre'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.dishes
    OWNER to postgres;

-- Table: public.payments

-- DROP TABLE IF EXISTS public.payments;

CREATE TABLE IF NOT EXISTS public.payments
(
    id integer NOT NULL DEFAULT nextval('payments_id_seq'::regclass),
    reservation_id integer,
    amount numeric(10,2) NOT NULL,
    method character varying(50) COLLATE pg_catalog."default" NOT NULL,
    status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pendiente'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT payments_pkey PRIMARY KEY (id),
    CONSTRAINT payments_reservation_id_fkey FOREIGN KEY (reservation_id)
        REFERENCES public.reservations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.payments
    OWNER to postgres;

-- Table: public.reservation_details

-- DROP TABLE IF EXISTS public.reservation_details;

CREATE TABLE IF NOT EXISTS public.reservation_details
(
    id integer NOT NULL DEFAULT nextval('reservation_details_id_seq'::regclass),
    reservation_id integer NOT NULL,
    dish_id integer NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    subtotal numeric(10,2) NOT NULL,
    CONSTRAINT reservation_details_pkey PRIMARY KEY (id),
    CONSTRAINT reservation_details_dish_id_fkey FOREIGN KEY (dish_id)
        REFERENCES public.dishes (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT reservation_details_reservation_id_fkey FOREIGN KEY (reservation_id)
        REFERENCES public.reservations (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reservation_details
    OWNER to postgres;

-- Table: public.reservations

-- DROP TABLE IF EXISTS public.reservations;

CREATE TABLE IF NOT EXISTS public.reservations
(
    id integer NOT NULL DEFAULT nextval('reservations_id_seq'::regclass),
    user_id integer NOT NULL,
    reservation_date date NOT NULL,
    reservation_time time without time zone NOT NULL,
    people_count integer NOT NULL,
    table_id integer,
    status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pendiente'::character varying,
    total numeric(10,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    estado character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pendiente'::character varying,
    pago_estado character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'pendiente'::character varying,
    pago_monto numeric(10,2),
    CONSTRAINT reservations_pkey PRIMARY KEY (id),
    CONSTRAINT reservations_table_id_fkey FOREIGN KEY (table_id)
        REFERENCES public.tables (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT reservations_people_count_check CHECK (people_count >= 1 AND people_count <= 8),
    CONSTRAINT reservations_status_check CHECK (status::text = ANY (ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'cancelada'::character varying]::text[])),
    CONSTRAINT reservations_estado_check CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'ocupada'::character varying, 'cancelada'::character varying, 'completada'::character varying]::text[])),
    CONSTRAINT reservations_pago_estado_check CHECK (pago_estado::text = ANY (ARRAY['pendiente'::character varying, 'pagado'::character varying, 'fallido'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.reservations
    OWNER to postgres;

-- Table: public.tables

-- DROP TABLE IF EXISTS public.tables;

CREATE TABLE IF NOT EXISTS public.tables
(
    id integer NOT NULL DEFAULT nextval('tables_id_seq'::regclass),
    table_number integer NOT NULL,
    capacity integer NOT NULL,
    available boolean DEFAULT true,
    estado character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'disponible'::character varying,
    CONSTRAINT tables_pkey PRIMARY KEY (id),
    CONSTRAINT tables_table_number_key UNIQUE (table_number),
    CONSTRAINT tables_estado_check CHECK (estado::text = ANY (ARRAY['disponible'::character varying, 'ocupada'::character varying]::text[]))
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.tables
    OWNER to postgres;