import { NextResponse } from 'next/server';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.resolve(process.cwd(), 'model', "nezha.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const nezhaService = protoDescriptor.proto.NezhaService;

export async function POST(request) {
    const { server, secret, cpuUsage, memoryUsed, diskUsed, networkIn, networkOut, networkInSpeed, networkOutSpeed, uptime } = await request.json();

    const client = new nezhaService(server, grpc.credentials.createInsecure());

    const metadata = new grpc.Metadata();
    metadata.add('client_secret', secret);

    const status = {
        cpu: cpuUsage,
        mem_used: memoryUsed,
        swap_used: 0,
        disk_used: diskUsed,
        net_in_transfer: networkIn,
        net_out_transfer: networkOut,
        net_in_speed: networkInSpeed,
        net_out_speed: networkOutSpeed,
        uptime: uptime,
        load1: 0,
        load5: 0,
        load15: 0,
        tcp_conn_count: 0,
        udp_conn_count: 0,
        process_count: 0,
        State_SensorTemperature: [],
        gpu: 0
    }

    return reportSystemStatus(client, status, metadata)
        .then(() => NextResponse.json({ success: true }))
        .catch(error => NextResponse.json({ success: false, error: error.details }, { status: 500 }));
}

const reportSystemStatus = (client, status, metadata) => {
    return new Promise((resolve, reject) => {
        client.ReportSystemState(status, metadata, (error, response) => {
            if (error) {
                console.error(error);
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};
