import { supabase } from "../lib/supabase";

export const getHousemates = async () => {

    const { data: { user } } = await supabase.auth.getUser()

    const { data: house_id, error } = await supabase
        .from("tenants")
        .select("house_id")
        .eq("tenant_id", user.id)
        .single();

    console.log("Getting housemates");
    console.log("House ID:", house_id);

    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("house_id", house_id.house_id)
      .neq("tenant_id", user.id);

    if (tenantsError) {
      throw tenantsError
    }

    return tenants.map(row => row.tenant_id)
}

export const getHousematesNames = async () => {
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
