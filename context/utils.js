import { supabase } from "../lib/supabase";

const getHousemates = async () => {
    const { data: house_id, error } = await supabase
        .from("house_to_tenant")
        .select("house_id")
        .eq("tenant_id", supabase.auth.user().id)
        .single();

    const { data: tenants, error: tenantsError } = await supabase
      .from("house_to_tenant")
      .select("tenant_id")
      .eq("house_id", house_id)
      .neq("tenant_id", supabase.auth.user().id);

    if (tenantsError) {
      throw tenantsError
    }

    return tenants.map(row => row.tenant_id)
}

const getHousematesNames = async () => {
    const housemates = await getHousemates();

    const { data: housematesData, error } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .in("id", housemates);

    if (error) {
      throw error;
    }

    return housematesData.map(user => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`
    }));
}
