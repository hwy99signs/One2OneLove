-- One2OneLove: prevent one verified mobile number from being reused by multiple member accounts.
-- Administrator accounts are exempt from the member-account uniqueness rule.
CREATE OR REPLACE FUNCTION public.enforce_unique_verified_member_phone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_role text;
BEGIN
  IF NEW.phone_number IS NULL OR COALESCE(NEW.phone_number_verified,false) IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(role,'user') INTO current_role
  FROM neon_auth."user"
  WHERE id=NEW.id;

  IF current_role='admin' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.phone_number,0));

  IF EXISTS (
    SELECT 1
    FROM public.users u
    JOIN neon_auth."user" a ON a.id=u.id
    WHERE u.id<>NEW.id
      AND u.phone_number=NEW.phone_number
      AND COALESCE(u.phone_number_verified,false)=true
      AND COALESCE(a.role,'user')<>'admin'
  ) THEN
    RAISE EXCEPTION 'verified mobile number already belongs to another member account'
      USING ERRCODE='23505', CONSTRAINT='users_unique_verified_member_phone';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unique_verified_member_phone ON public.users;
CREATE TRIGGER trg_unique_verified_member_phone
BEFORE INSERT OR UPDATE OF phone_number,phone_number_verified
ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_unique_verified_member_phone();
