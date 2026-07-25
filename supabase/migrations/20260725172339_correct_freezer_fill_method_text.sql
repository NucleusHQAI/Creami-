alter table public.app_settings
  alter column standard_method set default
    'Blend the base and flavour additions until completely smooth. Top up the base mixture to your freezer fill line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15 to 30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the mix-ins and run MIX-IN once.';

update public.app_settings
set standard_method =
  'Blend the base and flavour additions until completely smooth. Top up the base mixture to your freezer fill line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15 to 30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the mix-ins and run MIX-IN once.'
where id = 1
  and standard_method = (
    'Blend the base and flavour additions until completely smooth. Fill only to your Deluxe MAX FILL line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15'
    || chr(8211) ||
    '30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the extras and run MIX-IN once.'
  );
